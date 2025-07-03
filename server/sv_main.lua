lib.versionCheck('jellyton69/paragon_shops')
if not lib.checkDependency('ox_lib', '3.0.0') then error() end
if not lib.checkDependency('ox_inventory', '2.20.0') then error() end

-- ESX Initialisierung
ESX = exports['es_extended']:getSharedObject()

local config = require 'config.config'

local lastRobbery = {}

---Dispatch helper
---@param coords vector3
local function sendPoliceDispatch(coords)
    for _, playerId in ipairs(GetPlayers()) do
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if xPlayer and xPlayer.job and xPlayer.job.name == 'police' then
            TriggerClientEvent('Paragon-Shops:Client:PoliceDispatch', playerId, coords)
        end
    end
end

local ox_inventory = exports.ox_inventory
local ITEMS = ox_inventory:Items()

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

RegisterNetEvent('Paragon-Shops:Server:RobberyStarted', function(shopId, location)
    local shopData = LOCATIONS[shopId]
    if not shopData or not shopData.coords or not shopData.coords[location] then return end

    if math.random() < (config.robbery.dispatchChance or 0) then
        local coords = shopData.coords[location]
        sendPoliceDispatch(vector3(coords.x, coords.y, coords.z))
    end
end)

RegisterNetEvent('Paragon-Shops:Server:RobberyReward', function(progress)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    if not xPlayer then return end

    local now = os.time() * 1000
    if lastRobbery[src] and now - lastRobbery[src] < (config.robbery.cooldown or 60000) then
        return
    end
    lastRobbery[src] = now

    local amount = math.floor((config.robbery.reward or 0) * (progress or 0))
    if amount > 0 then
        xPlayer.addMoney(amount)
    end
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

lib.callback.register("Paragon-Shops:Server:PurchaseItems", function(source, purchaseData)
	if not purchaseData then
            lib.print.warn(GetPlayerName(source) .. " may be attempting to exploit Paragon-Shops:Server:PurchaseItems.")
		return false
	end

	if not purchaseData.shop then
            lib.print.warn(GetPlayerName(source) .. " may be attempting to exploit Paragon-Shops:Server:PurchaseItems.")
		lib.print.warn(purchaseData)
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
			if shopItem.license then
				ESX.TriggerServerCallback('esx_license:checkLicense', function(hasLicense)
					if not hasLicense then
						TriggerClientEvent('ox_lib:notify', source, { 
                                title = "Lizenz erforderlich",
                                description = "Du besitzt nicht die Lizenz, um diesen Gegenstand (" .. shopItem.license .. ") zu kaufen.",
							type = "error" 
						})
						return
					end
				end, source, shopItem.license)
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
		exports.ox_inventory:CustomDrop('Shop Drop', dropItems, GetEntityCoords(GetPlayerPed(source)), #dropItems, 10000, GetPlayerRoutingBucket(source), `prop_cs_shopping_bag`)
	end

	return true
end)

AddEventHandler('onResourceStart', function(resource)
	if GetCurrentResourceName() ~= resource and "ox_inventory" ~= resource then return end

	-- Validate items exist in ox_inventory
	for productType, productData in pairs(PRODUCTS) do
		for _, item in pairs(productData) do
			if not ITEMS[(string.find(item.name, "weapon_") and (item.name):upper()) or item.name] then
				lib.print.error("Invalid Item: ", item.name, "in product table:", productType, "^7")
				productData[item] = nil
			end
		end
	end

	-- Register shops
	for shopID, shopData in pairs(LOCATIONS) do
		if not shopData.shopItems or not PRODUCTS[shopData.shopItems] then
			lib.print.error("A valid product ID (" .. (shopData.shopItems or "nil") .. ") for [" .. shopID .. "] was not found.")
			goto continue
		end

		local shopProducts = {}
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

		registerShop(shopID, {
			name = shopData.label,
			inventory = shopProducts,
			groups = shopData.groups,
			coords = shopData.coords
		})

		::continue::
	end
	
        lib.print.info("Paragon-Shops loaded successfully with " .. lib.table.tablesize(ShopData) .. " shop types")
end)
