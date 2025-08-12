lib.versionCheck('jellyton69/paragon_shops')
if not lib.checkDependency('ox_lib', '3.0.0') then error() end
if not lib.checkDependency('ox_inventory', '2.20.0') then error() end

-- ESX Initialisierung
ESX = exports['es_extended']:getSharedObject()

local config = require 'config.config'

-- Server-Callback für Lizenzabfrage
lib.callback.register('Paragon-Shops:Server:GetPlayerLicenses', function(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then 
        return {} 
    end

    local identifier = xPlayer.identifier
    if not identifier then 
        return {} 
    end
    
    local result = MySQL.query.await('SELECT type FROM user_licenses WHERE owner = ?', {identifier})
    local licenses = {}
    
    if result and #result > 0 then
        for _, license in ipairs(result) do
            licenses[license.type] = true
        end
    end
    
    return licenses
end)

-- Debug Command für Server-seitige Lizenzprüfung (entfernt für Produktion)
-- RegisterCommand('serverlicensecheck', function(source, args)
--     if source == 0 then -- Server console
--         if args[1] then
--             local targetSource = tonumber(args[1])
--             if targetSource then
--                 local xPlayer = ESX.GetPlayerFromId(targetSource)
--                 if xPlayer then
--                     local identifier = xPlayer.identifier
--                     local result = MySQL.query.await('SELECT type FROM user_licenses WHERE owner = ?', {identifier})
--                     print("License check for " .. GetPlayerName(targetSource) .. " (" .. identifier .. "):")
--                     if result and #result > 0 then
--                         for _, license in ipairs(result) do
--                             print("  - " .. license.type)
--                         end
--                     else
--                         print("  No licenses found")
--                     end
--                 else
--                     print("Player not found")
--                 end
--             else
--                 print("Invalid player ID")
--             end
--         else
--             print("Usage: serverlicensecheck <playerid>")
--         end
--     end
-- end, true)

local shopCooldowns = {}
local activeRobberies = {}

-- Rate Limiting System
local playerPurchaseHistory = {}
local playerPurchaseCooldowns = {}

-- Rate Limiting Helper Functions
local function checkRateLimit(source)
    if not config.security.enableRateLimit then return true end
    
    local now = os.time()
    local playerId = tostring(source)
    
    -- Initialize player history if not exists
    if not playerPurchaseHistory[playerId] then
        playerPurchaseHistory[playerId] = {}
    end
    
    -- Clean old entries (older than 1 minute)
    local history = playerPurchaseHistory[playerId]
    for i = #history, 1, -1 do
        if now - history[i] > 60 then
            table.remove(history, i)
        end
    end
    
    -- Check if player exceeded rate limit
    if #history >= config.security.maxPurchasesPerMinute then
        return false
    end
    
    -- Add current purchase to history
    table.insert(history, now)
    return true
end

local function logSuspiciousActivity(source, activity, details)
    if not config.security.logSuspiciousActivity then return end
    
    local playerName = GetPlayerName(source) or "Unknown"
    local logMessage = string.format("[SUSPICIOUS] %s (ID: %s) - %s: %s", 
        playerName, source, activity, details or "No details")
    
    lib.print.warn(logMessage)
    
    if config.logWebhook and config.logWebhook ~= '' then
        sendWebhookLog("Suspicious Activity", logMessage)
    end
end

local function validatePurchaseData(source, purchaseData)
    if not purchaseData then
        logSuspiciousActivity(source, "Invalid Purchase Data", "purchaseData is nil")
        return false
    end
    
    if not purchaseData.shop then
        logSuspiciousActivity(source, "Invalid Purchase Data", "shop data missing")
        return false
    end
    
    if not purchaseData.items or type(purchaseData.items) ~= "table" then
        logSuspiciousActivity(source, "Invalid Purchase Data", "items data invalid")
        return false
    end
    
    -- Check max items per purchase
    if #purchaseData.items > config.security.maxItemsPerPurchase then
        logSuspiciousActivity(source, "Excessive Items", 
            string.format("Attempted to buy %d items (max: %d)", 
            #purchaseData.items, config.security.maxItemsPerPurchase))
        return false
    end
    
    return true
end

-- Helper to synchronously check player licenses using esx_license data
---@param source number player source
---@param licenseType string license name (e.g. 'weapon')
---@return boolean
local function playerHasLicense(source, licenseType)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end

    local identifier = xPlayer.identifier
    if not identifier or not licenseType then return false end

    local result = MySQL.scalar.await('SELECT type FROM user_licenses WHERE owner = ? AND type = ?',{identifier, licenseType})
    return result ~= nil
end

local function getShopKey(shopId, location)
    return (tostring(shopId) .. '#' .. tostring(location or 1))
end

local function loadCooldowns()
    local data = GetResourceKvpString('paragon_shops_cooldowns')
    if data then
        shopCooldowns = json.decode(data) or {}
    end
end

local function saveCooldowns()
    SetResourceKvp('paragon_shops_cooldowns', json.encode(shopCooldowns))
end

---Send log to Discord webhook if configured
---@param title string
---@param description string
local function sendWebhookLog(title, description)
    if not config.logWebhook or config.logWebhook == '' then return end
    local payload = json.encode({
        username = 'Shop Logs',
        embeds = {{title = title, description = description, color = 3066993}}
    })
    PerformHttpRequest(config.logWebhook, function() end, 'POST', payload, {['Content-Type'] = 'application/json'})
end

---Dispatch helper
---@param coords vector3
local function sendPoliceDispatch(coords)
    for _, playerId in ipairs(GetPlayers()) do
        local playerIdNum = tonumber(playerId)
        if playerIdNum then
            local xPlayer = ESX.GetPlayerFromId(playerIdNum)
            if xPlayer and xPlayer.job and xPlayer.job.name == 'police' then
                TriggerClientEvent('Paragon-Shops:Client:PoliceDispatch', playerIdNum, coords)
            end
        end
    end
end

local ox_inventory = exports.ox_inventory
local ITEMS = ox_inventory:Items()
local SellPriceConfig = require 'config.sell_prices'
local ItemPrices = {}

local PRODUCTS = require 'config.shop_items' ---@type table<string, table<string, ShopItem>>
local LOCATIONS = require 'config.locations' ---@type type<string, ShopLocation>

ShopData = {}

---@class ShopData
---@field name string
---@field location string
---@field inventory OxItem[]
---@field groups table

---@param shopType string
---@param shopData table
local function registerShop(shopType, shopData)
	ShopData[shopType] = {}

	if shopData.coords then
		for locationId, locationData in pairs(shopData.coords) do
			local shop = {
				name = shopData.name,
				location = locationId,
				inventory = lib.table.deepclone(shopData.inventory),
				groups = shopData.groups,
				coords = locationData
			}

			ShopData[shopType][locationId] = shop
		end
	else
		local shop = {
			name = shopData.name,
			inventory = lib.table.deepclone(shopData.inventory),
			groups = shopData.groups
		}

		ShopData[shopType][1] = shop
	end
end

lib.callback.register("Paragon-Shops:Server:OpenShop", function(source, shop_type, location)
        local shop = ShopData[shop_type] and ShopData[shop_type][location]
        if not shop then
                lib.print.error("Shop not found: " .. shop_type .. " at location " .. location)
                return nil
        end
        return shop.inventory
end)

AddEventHandler('onResourceStop', function(resource)
        if GetCurrentResourceName() ~= resource then return end
        saveCooldowns()
end)

RegisterNetEvent('Paragon-Shops:Server:RobberyStarted', function(shopId, location)
    local shopData = LOCATIONS[shopId]
    if not shopData or not shopData.coords or not shopData.coords[location] then return end

    local key = getShopKey(shopId, location)
    if activeRobberies[key] then return end
    activeRobberies[key] = true

    if math.random() < (config.robbery.dispatchChance or 0) then
        local coords = shopData.coords[location]
        sendPoliceDispatch(vector3(coords.x, coords.y, coords.z))
    end
end)

RegisterNetEvent('Paragon-Shops:Server:RobberyReward', function(progress, shopId, location)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    if not xPlayer then return end

    local now = os.time() * 1000
    local key = getShopKey(shopId, location)
    local last = shopCooldowns[key] or 0
    if now - last < (config.robbery.cooldown or 60000) then
        return
    end
    shopCooldowns[key] = now
    activeRobberies[key] = nil
    saveCooldowns()

    local amount = math.floor((config.robbery.reward or 0) * (progress or 0))
    if amount > 0 then
        xPlayer.addMoney(amount)
    end
end)

lib.callback.register('Paragon-Shops:Server:GetRobberyCooldown', function(source, shopId, location)
    local key = getShopKey(shopId, location)
    local now = os.time() * 1000
    local last = shopCooldowns[key] or 0
    if activeRobberies[key] then
        return (config.robbery.cooldown or 60000)
    end
    local remain = (config.robbery.cooldown or 60000) - (now - last)
    return remain > 0 and remain or 0
end)

lib.callback.register("Paragon-Shops:Server:GetSocietyMoney", function(source, shopId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return 0 end

        local shopData = LOCATIONS[shopId]
        if not shopData then return 0 end

        local required = shopData.societies and shopData.societies[xPlayer.job.name]
        if not required then return 0 end

        if type(required) == 'number' then
                if xPlayer.job.grade < required then return 0 end
        elseif type(required) == 'string' then
                if xPlayer.job.grade_name ~= required then return 0 end
        end

        local account
        TriggerEvent('esx_addonaccount:getSharedAccount', 'society_' .. xPlayer.job.name, function(acc)
                account = acc
        end)

        return account and account.money or 0
end)

local mapBySubfield = function(tbl, subfield)
        local mapped = {}
        for i = 1, #tbl do
                local item = tbl[i]
                mapped[item[subfield]] = item
        end
        return mapped
end

lib.callback.register('Paragon-Shops:Server:GetInventoryItems', function(source, shopId)
        local inv = ox_inventory:GetInventory(source)
        if not inv or not inv.items then return {} end

        local allowed
        local shop = LOCATIONS[shopId]
        if shop then
                if type(shop.sellItems) == 'table' then
                        allowed = {}
                        for _, name in ipairs(shop.sellItems) do
                                allowed[name] = true
                        end
                elseif shop.sellItems == false or shop.sellItems == nil then
                        allowed = {}
                end
        end

        local items = {}
        local id = 0
        for _, item in pairs(inv.items) do
                if item.count and item.count > 0 then
                        if allowed and not allowed[item.name] then goto continue end
                        id = id + 1
                        local data = ITEMS[item.name]
                        items[#items + 1] = {
                                id = id,
                                name = item.name,
                                label = data and data.label or item.name,
                                price = ItemPrices[item.name] or 0,
                                weight = data and data.weight or 0,
                                count = item.count,
                                imagePath = GetItemIcon(item.name)
                        }
                        ::continue::
                end
        end

        table.sort(items, function(a,b) return a.name < b.name end)
        return items
end)

lib.callback.register('Paragon-Shops:Server:SellItem', function(source, item)
        if not item or not item.name then return false end
        if item.shop then
                local shop = LOCATIONS[item.shop]
                if shop then
                        if type(shop.sellItems) == 'table' then
                                local allowed = false
                                for _, name in ipairs(shop.sellItems) do
                                        if name == item.name then allowed = true break end
                                end
                                if not allowed then return false end
                        elseif shop.sellItems == false or shop.sellItems == nil then
                                return false
                        end
                end
        end
        local price = ItemPrices[item.name]
        if not price or price <= 0 then return false end

        local success = ox_inventory:RemoveItem(source, item.name, 1)
        if success then
                local xPlayer = ESX.GetPlayerFromId(source)
                if xPlayer then
                        xPlayer.addMoney(price)
                        local label = ITEMS[item.name] and ITEMS[item.name].label or item.name
                        sendWebhookLog('Item Sold', ("%s sold 1x %s for $%d"):format(GetPlayerName(source), label, price))
                end
                return true
        end
        return false
end)

lib.callback.register('Paragon-Shops:Server:SellItems', function(source, data)
    if not data or not data.items then return false end

    local allowed
    if data.shop then
        local shop = LOCATIONS[data.shop]
        if shop then
            if type(shop.sellItems) == 'table' then
                allowed = {}
                for _, name in ipairs(shop.sellItems) do
                    allowed[name] = true
                end
            elseif shop.sellItems == false or shop.sellItems == nil then
                allowed = {}
            end
        end
    end

    local total = 0
    local soldItems = {}
    for _, entry in ipairs(data.items) do
        local name = entry.name
        local amount = entry.quantity or 0
        if name and amount > 0 and (not allowed or allowed[name]) then
            local price = ItemPrices[name]
            if price and price > 0 then
                if ox_inventory:RemoveItem(source, name, amount) then
                    total = total + price * amount
                    local label = ITEMS[name] and ITEMS[name].label or name
                    soldItems[#soldItems + 1] = string.format("%dx %s", amount, label)
                end
            end
        end
    end

    if total > 0 then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            xPlayer.addMoney(total)
            local detail = table.concat(soldItems, "; ")
            sendWebhookLog('Items Sold', string.format('%s sold %s for $%d', GetPlayerName(source), detail, total))
        end
        return true
    end

    return false
end)

lib.callback.register("Paragon-Shops:Server:PurchaseItems", function(source, purchaseData)
	-- Rate Limiting Check
	if not checkRateLimit(source) then
		logSuspiciousActivity(source, "Rate Limit Exceeded", 
			string.format("Exceeded %d purchases per minute", config.security.maxPurchasesPerMinute))
		TriggerClientEvent('ox_lib:notify', source, {
			title = "Zu schnell",
			description = "Du kaufst zu schnell ein. Warte einen Moment.",
			type = "error"
		})
		return false
	end

	-- Validate purchase data
	if not validatePurchaseData(source, purchaseData) then
		return false
	end

	local xPlayer = ESX.GetPlayerFromId(source)
	if not xPlayer then
		lib.print.error("Player not found: " .. source)
		return false
	end

	local shop = ShopData[purchaseData.shop.id] and ShopData[purchaseData.shop.id][purchaseData.shop.location]
	local shopType = purchaseData.shop.id

	if not shop then
		lib.print.error("Invalid shop: " .. purchaseData.shop.id .. " called by: " .. GetPlayerName(source))
		return false
	end

	local shopData = LOCATIONS[purchaseData.shop.id]

	-- Job-Prüfung für ESX
	if shopData.jobs then
		if not shopData.jobs[xPlayer.job.name] then
			lib.print.error("Invalid job: " .. xPlayer.job.name .. " for shop: " .. purchaseData.shop.id .. " called by: " .. GetPlayerName(source))
			return false
		end

		if shopData.jobs[xPlayer.job.name] > xPlayer.job.grade then
			lib.print.error("Invalid job grade: " .. xPlayer.job.grade .. " for shop: " .. purchaseData.shop.id .. " called by: " .. GetPlayerName(source))
			return false
		end
	end

	local currency = purchaseData.currency
	local mappedCartItems = mapBySubfield(purchaseData.items, "id")
	local validCartItems = {}

	local totalPrice = 0
	for i = 1, #shop.inventory do
		local shopItem = shop.inventory[i]
		local itemData = ITEMS[shopItem.name]
		local mappedCartItem = mappedCartItems[shopItem.id]

                if mappedCartItem then
                        -- Lizenzprüfung für ESX
                        if shopItem.license and not playerHasLicense(source, shopItem.license) then
                                TriggerClientEvent('ox_lib:notify', source, {
                                        title = "Lizenz erforderlich",
                                        description = "Du besitzt nicht die Lizenz, um diesen Gegenstand (" .. shopItem.license .. ") zu kaufen.",
                                        type = "error"
                                })
                                goto continue
                        end

			if not exports.ox_inventory:CanCarryItem(source, shopItem.name, mappedCartItem.quantity) then
				TriggerClientEvent('ox_lib:notify', source, { 
                                title = "Inventar voll",
                                description = "Du kannst die angeforderte Menge von " .. itemData.label .. " nicht tragen.",
					type = "error" 
				})
				goto continue
			end

			if shopItem.count and (mappedCartItem.quantity > shopItem.count) then
				TriggerClientEvent('ox_lib:notify', source, { 
                                title = "Nicht auf Lager",
                                description = "Die gewünschte Menge von " .. itemData.label .. " ist nicht mehr vorrätig.",
					type = "error" 
				})
				goto continue
			end

			if shopItem.jobs then
				if not shopItem.jobs[xPlayer.job.name] then
					TriggerClientEvent('ox_lib:notify', source, { 
                                                title = "Job erforderlich",
                                                description = "Du hast nicht den erforderlichen Job, um " .. itemData.label .. " zu kaufen.",
						type = "error" 
					})
					goto continue
				end
				if shopItem.jobs[xPlayer.job.name] > xPlayer.job.grade then
					TriggerClientEvent('ox_lib:notify', source, { 
                                                title = "Dienstgrad erforderlich",
                                                description = "Du hast nicht den erforderlichen Dienstgrad, um " .. itemData.label .. " zu kaufen.",
						type = "error" 
					})
					goto continue
				end
			end

			local newIndex = #validCartItems + 1
			validCartItems[newIndex] = mappedCartItem
			validCartItems[newIndex].inventoryIndex = i

			totalPrice = totalPrice + (shopItem.price * mappedCartItem.quantity)
		end

		:: continue ::
	end

	local itemStrings = {}
	for i = 1, #validCartItems do
		local item = validCartItems[i]
		local itemData = ITEMS[item.name]
		itemStrings[#itemStrings + 1] = item.quantity .. "x " .. itemData.label
	end
	local purchaseReason = table.concat(itemStrings, "; ")

        -- Geld abziehen (ESX)
        if currency == "cash" then
                if xPlayer.getMoney() < totalPrice then
                        TriggerClientEvent('ox_lib:notify', source, {
                                title = "Nicht genug Geld",
                                description = "Du hast nicht genug Bargeld für diesen Einkauf.",
                                type = "error"
                        })
                        return false
                end
                xPlayer.removeMoney(totalPrice)
        elseif currency == "card" then
                local bankAccount = xPlayer.getAccount('bank')
                if not bankAccount or bankAccount.money < totalPrice then
                        TriggerClientEvent('ox_lib:notify', source, {
                                title = "Nicht genug Geld",
                                description = "Du hast nicht genug Geld auf der Bank für diesen Einkauf.",
                                type = "error"
                        })
                        return false
                end
                xPlayer.removeAccountMoney('bank', totalPrice)
       elseif currency == "society" then
               local required = shopData.societies and shopData.societies[xPlayer.job.name]
               if not required then
                       TriggerClientEvent('ox_lib:notify', source, {
                               title = "Berechtigung fehlt",
                               description = "Du darfst das Society-Konto nicht verwenden.",
                               type = "error"
                       })
                       return false
               end

               if type(required) == 'number' then
                       if xPlayer.job.grade < required then
                               TriggerClientEvent('ox_lib:notify', source, {
                                       title = "Berechtigung fehlt",
                                       description = "Du darfst das Society-Konto nicht verwenden.",
                                       type = "error"
                               })
                               return false
                       end
               elseif type(required) == 'string' then
                       if xPlayer.job.grade_name ~= required then
                               TriggerClientEvent('ox_lib:notify', source, {
                                       title = "Berechtigung fehlt",
                                       description = "Du darfst das Society-Konto nicht verwenden.",
                                       type = "error"
                               })
                               return false
                       end
               end

               local account
               TriggerEvent('esx_addonaccount:getSharedAccount', 'society_' .. xPlayer.job.name, function(acc)
                       account = acc
               end)

                if not account or account.money < totalPrice then
                        TriggerClientEvent('ox_lib:notify', source, {
                                title = "Nicht genug Geld",
                                description = "Deine Society hat nicht genug Geld für diesen Einkauf.",
                                type = "error"
                        })
                        return false
                end

                account.removeMoney(totalPrice)
                TriggerClientEvent('Paragon-Shops:Client:SetSocietyMoney', source, account.money)
        else
                lib.print.error("Invalid currency type used in purchase: " .. tostring(currency))
                return false
        end

	local dropItems = {}
	for i = 1, #validCartItems do
		local item = validCartItems[i]
		local itemData = ITEMS[item.name]
		local productData = PRODUCTS[shopData.shopItems][item.id]

		if not itemData then
			lib.print.error("Invalid item: " .. item.name .. " in shop: " .. shopType)
			goto continue
		end

		if not productData then
			lib.print.error("Invalid product: " .. item.name .. " in shop: " .. shopType)
			goto continue
		end

		local success, response = ox_inventory:AddItem(source, item.name, item.quantity, productData.metadata)
		if success then
			if shop.inventory[item.inventoryIndex].count then
				shop.inventory[item.inventoryIndex].count = shop.inventory[item.inventoryIndex].count - item.quantity
			end
		else
			-- Refund money if item couldn't be added
			local itemPrice = item.quantity * shop.inventory[item.inventoryIndex].price
			if currency == "cash" then
				xPlayer.addMoney(itemPrice)
			else
				xPlayer.addAccountMoney('bank', itemPrice)
			end
			
			-- Add to drop items if inventory is full
			dropItems[#dropItems + 1] = {
				name = item.name,
				count = item.quantity,
				metadata = productData.metadata
			}
		end

		:: continue ::
	end

        if #dropItems > 0 then
                exports.ox_inventory:CustomDrop('Shop Drop', dropItems, GetEntityCoords(GetPlayerPed(source)), #dropItems, 10000, GetPlayerRoutingBucket(source), GetHashKey('prop_cs_shopping_bag'))
        end

        sendWebhookLog('Items Purchased', string.format('%s bought %s from %s for $%d', GetPlayerName(source), purchaseReason, shopData.label or shopType, totalPrice))
        return true
end)

AddEventHandler('onResourceStart', function(resource)
        if GetCurrentResourceName() ~= resource and "ox_inventory" ~= resource then return end

        if GetCurrentResourceName() == resource then
                loadCooldowns()
        end

        -- Validate items exist in ox_inventory
        for productType, productData in pairs(PRODUCTS) do
                for _, item in pairs(productData) do
                        if not ITEMS[(string.find(item.name, "weapon_") and (item.name):upper()) or item.name] then
                                lib.print.error("Invalid Item: ", item.name, "in product table:", productType, "^7")
                                productData[item] = nil
                        end
                        ItemPrices[item.name] = SellPriceConfig[item.name] or math.floor(item.price * 0.5)
                end
        end

	-- Register shops
        for shopID, shopData in pairs(LOCATIONS) do
                local shopProducts = {}

                if shopData.shopItems then
                        if not PRODUCTS[shopData.shopItems] then
                                lib.print.error("A valid product ID (" .. tostring(shopData.shopItems) .. ") for [" .. shopID .. "] was not found.")
                                goto continue
                        end

                        for item, data in pairs(PRODUCTS[shopData.shopItems]) do
                                shopProducts[#shopProducts + 1] = {
                                        id = tonumber(item) or #shopProducts + 1,
                                        name = data.name,
                                        price = config.fluctuatePrices and (math.floor(data.price * (math.random(80, 120) / 100))) or data.price or 0,
                                        license = data.license,
                                        metadata = data.metadata,
                                        count = data.defaultStock,
                                        jobs = data.jobs
                                }
                        end

                        table.sort(shopProducts, function(a, b)
                                return a.name < b.name
                        end)
                elseif not shopData.sellItems then
                        lib.print.error("Shop [" .. shopID .. "] has neither shopItems nor sellItems defined.")
                        goto continue
                end

                registerShop(shopID, {
                        name = shopData.label,
                        inventory = shopProducts,
                        groups = shopData.groups,
                        coords = shopData.coords
                })

		::continue::
	end
	
        local shopCount = 0
        for _ in pairs(ShopData) do
                shopCount = shopCount + 1
        end
        lib.print.info("Paragon-Shops loaded successfully with " .. shopCount .. " shop types")
end)
