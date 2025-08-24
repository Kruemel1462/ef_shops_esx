if not lib.checkDependency('ox_lib', '3.0.0') then error() end
if not lib.checkDependency('ox_inventory', '2.20.0') then error() end

-- ESX Initialisierung
ESX = exports['es_extended']:getSharedObject()

local config = require 'config.config'

local PRODUCTS = require 'config.shop_items' ---@type table<string, table<string, ShopItem>>
local LOCATIONS = require 'config.locations' ---@type type<string, ShopLocation>

local ITEMS = exports.ox_inventory:Items()

local Vendors = {}
local VendorScenarios = {}
local Points = {}
local Blips = {}
local DispatchBlips = {}
local NearbyShops = {} -- Neue Tabelle für nahegelegene Shops

ShopOpen = false
local societyMoney = 0
local CurrentShop
local robberyCooldown = 0
local isRobbing = false

-- Cleanup-Funktion um doppelte Peds zu verhindern
local function CleanupAllVendors()
    for key, vendor in pairs(Vendors) do
        if DoesEntityExist(vendor) then
            if IsModelAPed(GetEntityModel(vendor)) then
                DeletePed(vendor)
            else
                DeleteEntity(vendor)
            end
        end
    end
    Vendors = {}
    VendorScenarios = {}
end

local scenarios = {
        "WORLD_HUMAN_VALET",
        "WORLD_HUMAN_AA_COFFEE",
        "WORLD_HUMAN_GUARD_STAND_CASINO",
        "WORLD_HUMAN_GUARD_PATROL",
        "PROP_HUMAN_STAND_IMPATIENT",
}

-- Prüfen, ob Spieler einen Shop überhaupt sehen darf (Job-Gating)
local function ShouldSeeShop(storeData)
    if not storeData or not storeData.jobs then
        return true
    end
    if not ESX or not ESX.PlayerData or not ESX.PlayerData.job then
        return false
    end
    local playerJob = ESX.PlayerData.job
    local required = storeData.jobs[playerJob.name]
    if not required then
        return false
    end
    if type(required) == 'number' then
        return playerJob.grade >= required
    end
    -- Falls jobs als Map ohne Grade definiert wurden, reicht Vorhandensein
    return true
end

-- Vorwärtsdeklaration, damit in früher kompilierten Closures verfügbar
local ShowShopText
local HideShopText

local function DestroyAllShopEntities()
    -- Entferne Vendor Entities
    for _, entity in pairs(Vendors) do
        if DoesEntityExist(entity) then
            if IsModelAPed(GetEntityModel(entity)) then
                DeletePed(entity)
            else
                DeleteEntity(entity)
            end
        end
    end
    Vendors = {}
    VendorScenarios = {}

    -- Entferne Points
    for _, point in ipairs(Points) do
        if point and point.remove then
            point:remove()
        end
    end
    Points = {}
    NearbyShops = {}
    lib.hideTextUI()

    -- Entferne Blips
    for _, blip in ipairs(Blips) do
        if blip and DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    Blips = {}
end

local function BuildAllShops()
    -- Cleanup bestehende Vendors um Duplikate zu verhindern
    CleanupAllVendors()
    DestroyAllShopEntities()
    
    for shopID, storeData in pairs(LOCATIONS) do
        if not storeData.coords then goto continue end
        if not ShouldSeeShop(storeData) then goto continue end

        for locationIndex, locationCoords in pairs(storeData.coords) do
            -- Blip erstellen
            if storeData.blip and not storeData.blip.disabled then
                local StoreBlip = AddBlipForCoord(locationCoords.x, locationCoords.y, locationCoords.z)
                SetBlipSprite(StoreBlip, storeData.blip.sprite)
                SetBlipScale(StoreBlip, storeData.blip.scale or 0.7)
                SetBlipDisplay(StoreBlip, 6)
                SetBlipColour(StoreBlip, storeData.blip.color)
                SetBlipAsShortRange(StoreBlip, true)

                local name = storeData.label

                AddTextEntry(name, name)
                BeginTextCommandSetBlipName(name)
                EndTextCommandSetBlipName(StoreBlip)

                Blips[#Blips + 1] = StoreBlip
            end

            local model = type(storeData.model) == "table" and storeData.model[math.random(1, #storeData.model)] or storeData.model

            if model then -- Create entity
                local createEntity
                local deleteEntity
                if IsModelAPed(model) then
                    function createEntity()
                        Vendors[shopID .. locationIndex] = CreatePed(0, model, locationCoords.x, locationCoords.y, locationCoords.z - 1.0, locationCoords.w, false, false)
                        SetEntityInvincible(Vendors[shopID .. locationIndex], true)
                        local scen = storeData.scenario or scenarios[math.random(1, #scenarios)]
                        VendorScenarios[shopID .. locationIndex] = scen
                        TaskStartScenarioInPlace(Vendors[shopID .. locationIndex], scen, -1, true)
                        SetBlockingOfNonTemporaryEvents(Vendors[shopID .. locationIndex], true)
                        SetEntityNoCollisionEntity(Vendors[shopID .. locationIndex], cache.ped, false)
                        FreezeEntityPosition(Vendors[shopID .. locationIndex], true)
                    end

                    function deleteEntity()
                        local vendorKey = shopID .. locationIndex
                        if Vendors[vendorKey] and DoesEntityExist(Vendors[vendorKey]) then
                            DeletePed(Vendors[vendorKey])
                        end
                        Vendors[vendorKey] = nil
                        VendorScenarios[vendorKey] = nil
                    end
                else
                    function createEntity()
                        Vendors[shopID .. locationIndex] = CreateObject(model, locationCoords.x, locationCoords.y, locationCoords.z - 1.03, false, false, false)
                        SetEntityHeading(Vendors[shopID .. locationIndex], locationCoords.w)
                        FreezeEntityPosition(Vendors[shopID .. locationIndex], true)
                    end

                    function deleteEntity()
                        local vendorKey = shopID .. locationIndex
                        if Vendors[vendorKey] and DoesEntityExist(Vendors[vendorKey]) then
                            DeleteEntity(Vendors[vendorKey])
                        end
                        Vendors[vendorKey] = nil
                        VendorScenarios[vendorKey] = nil
                    end
                end

                -- Point System für Nähe-Erkennung (Spawn/Despawn Vendor)
                local point = lib.points.new(locationCoords, 25)
                function point:onEnter()
                    -- Verbesserte Überprüfung gegen Doppelspawning
                    local vendorKey = shopID .. locationIndex
                    if Vendors[vendorKey] and DoesEntityExist(Vendors[vendorKey]) then
                        return -- Vendor existiert bereits
                    end
                    
                    -- Cleanup falls ein ungültiger Vendor-Eintrag existiert
                    if Vendors[vendorKey] and not DoesEntityExist(Vendors[vendorKey]) then
                        Vendors[vendorKey] = nil
                        VendorScenarios[vendorKey] = nil
                    end
                    
                    while not HasModelLoaded(model) do
                        pcall(function()
                            lib.requestModel(model)
                        end)
                    end
                    createEntity()
                end

                function point:onExit()
                    deleteEntity()
                end

                -- Nähe-Punkt für E-Taste Interaktion
                local radius = (storeData.target and storeData.target.radius) or 2.0
                local interactionPoint = lib.points.new(locationCoords, radius)
                function interactionPoint:onEnter()
                    NearbyShops[shopID .. locationIndex] = {
                        shopID = shopID,
                        locationIndex = locationIndex,
                        storeData = storeData
                    }
                    ShowShopText(storeData)
                end

                function interactionPoint:onExit()
                    NearbyShops[shopID .. locationIndex] = nil
                    if next(NearbyShops) == nil then -- Keine Shops in der Nähe
                        HideShopText()
                    end
                end

                Points[#Points + 1] = point
                Points[#Points + 1] = interactionPoint
            else
                -- Punkt ohne Entity für E-Taste Interaktion
                local radius = (storeData.target and storeData.target.radius) or 2.0
                local interactionPoint = lib.points.new(locationCoords, radius)
                function interactionPoint:onEnter()
                    NearbyShops[shopID .. locationIndex] = {
                        shopID = shopID,
                        locationIndex = locationIndex,
                        storeData = storeData
                    }
                    ShowShopText(storeData)
                end

                function interactionPoint:onExit()
                    NearbyShops[shopID .. locationIndex] = nil
                    if next(NearbyShops) == nil then -- Keine Shops in der Nähe
                        HideShopText()
                    end
                end

                Points[#Points + 1] = interactionPoint
            end
        end
        :: continue ::
    end
end

local function playFearAnim(ped)
    if not ped or ped == 0 then return end
    lib.requestAnimDict('amb@code_human_cower@female@react_cowering')
    TaskPlayAnim(ped, 'amb@code_human_cower@female@react_cowering', 'base_back_left', 8.0, -8.0, -1, 49, 0, false, false, false)
end

local function restoreVendorAnim(vendorKey)
    local ped = Vendors[vendorKey]
    if not ped or ped == 0 or not DoesEntityExist(ped) then return end
    ClearPedTasks(ped)
    local scenario = VendorScenarios[vendorKey] or scenarios[1]
    TaskStartScenarioInPlace(ped, scenario, -1, true)
end

local function setShopVisible(shouldShow)
	ShopOpen = shouldShow
	SetNuiFocus(shouldShow, shouldShow)
	SendReactMessage("setVisible", shouldShow)
end

-- Verbesserte Hilfsfunktion um Geld-Daten zu formatieren
local function GetPlayerMoney()
    -- Stelle sicher, dass PlayerData aktuell ist
    ESX.PlayerData = ESX.GetPlayerData()
    
    if not ESX.PlayerData then
        return { Cash = 0, Bank = 0, Society = 0 }
    end
    
    local cashMoney = 0
    local bankMoney = 0
    
    -- ESX Account System - durchsuche alle Accounts
    if ESX.PlayerData.accounts then
        for i=1, #ESX.PlayerData.accounts do
            if ESX.PlayerData.accounts[i].name == 'money' then
                cashMoney = ESX.PlayerData.accounts[i].money
            elseif ESX.PlayerData.accounts[i].name == 'bank' then
                bankMoney = ESX.PlayerData.accounts[i].money
            end
        end
    end
    
    -- Fallback: Versuche auch ESX.PlayerData.money für Cash
    if cashMoney == 0 and ESX.PlayerData.money then
        cashMoney = ESX.PlayerData.money
    end
    
    -- Society Money vom Server abfragen (wenn verfügbar)
    local societyMoney = 0
    if ShopOpen and CurrentShop then
        societyMoney = lib.callback.await('Paragon-Shops:Server:GetSocietyMoney', false, CurrentShop.id) or 0
    end
    
    return {
        Cash = cashMoney,
        Bank = bankMoney,
        Society = societyMoney
    }
end

-- Hilfsfunktion um PlayerData zu aktualisieren
local function UpdatePlayerData()
	ESX.PlayerData = ESX.GetPlayerData()
	
	-- Lizenzen über unseren eigenen Server-Callback laden
	lib.callback('Paragon-Shops:Server:GetPlayerLicenses', false, function(licenses)
		if licenses then
			PlayerLicenses = licenses
		else
			PlayerLicenses = {}
		end
		
		-- Daten ans Frontend senden nach dem Lizenzladen
		if ShopOpen then
			SendReactMessage("setSelfData", {
				weight = exports.ox_inventory:GetPlayerWeight(),
				maxWeight = exports.ox_inventory:GetPlayerMaxWeight(),
				money = GetPlayerMoney(),
				job = {
					name = ESX.PlayerData.job.name,
					grade = ESX.PlayerData.job.grade
				},
				licenses = PlayerLicenses
			})
		end
	end)
end

-- Variable für Lizenzen
local PlayerLicenses = {}

-- Hilfsfunktion um Lizenzen zu holen
local function GetPlayerLicenses()
    return PlayerLicenses
end

---@param data { type: string, location?: number }
local function openShop(data)
	if not data.location then data.location = 1 end

	local shopData = LOCATIONS[data.type]

	if not shopData then
		lib.print.error("Attempted to open a shop that does not exist: " .. data.type)
		return
	end

	-- Job-Prüfung für ESX
	if shopData.jobs then
		local playerJob = ESX.PlayerData.job
                if not playerJob then
                        lib.notify({ title = "Shop-Zugang", description = "Du hast keinen Zugriff auf diesen Shop.", type = "error" })
                        return
                end
		
		if shopData.jobs[playerJob.name] and shopData.jobs[playerJob.name] <= playerJob.grade then
			-- Access granted
		else
                        lib.notify({ title = "Shop-Zugang", description = "Du hast keinen Zugriff auf diesen Shop.", type = "error" })
                        return
                end
	end

	setShopVisible(true)

        local shopItems = lib.callback.await("Paragon-Shops:Server:OpenShop", false, data.type, data.location)

        if not shopItems then
		lib.print.error("Failed opening shop: " .. data.type)
		setShopVisible(false)
		return
        end

        -- Nur Shop-Items verarbeiten, wenn der Shop welche hat
        if shopData.shopItems then
                for _, item in pairs(shopItems) do
                        local productData = PRODUCTS[shopData.shopItems][item.id]

                        item.label = (productData.metadata and productData.metadata.label) or (ITEMS[item.name] and ITEMS[item.name].label) or item.name
                        item.weight = (productData.metadata and productData.metadata.weight) or (ITEMS[item.name] and ITEMS[item.name].weight) or 0
                        item.category = productData.category
                        item.imagePath = (productData.metadata and productData.metadata.imageurl) or GetItemIcon(item.name)
                        item.jobs = productData.jobs
                        item.basePrice = productData.price or item.price
                end
        end

        societyMoney = lib.callback.await('Paragon-Shops:Server:GetSocietyMoney', false, data.type)

        UpdatePlayerData()

        CurrentShop = { id = data.type, location = data.location }
        local canBuy = shopData.shopItems ~= nil
        local canSell = shopData.sellItems ~= nil and shopData.sellItems ~= false
        
        -- Erst die Shop-Daten senden, dann die Self-Daten und Shop-Items
        -- Prüfe ob Robbery für diesen Shop deaktiviert ist
        local canRob = true
        if config.robbery and config.robbery.disabledShops then
                for _, disabledShop in pairs(config.robbery.disabledShops) do
                        if disabledShop == data.type then
                                canRob = false
                                break
                        end
                end
        end

        local shopInfo = {
            id = data.type,
            location = data.location,
            label = LOCATIONS[data.type].label,
            canBuy = canBuy,
            canSell = canSell,
            canRob = canRob
        }
        
        SendReactMessage("setCurrentShop", shopInfo)

        -- Lizenzen laden und dann Spielerdaten senden
        lib.callback('Paragon-Shops:Server:GetPlayerLicenses', false, function(licenses)
            PlayerLicenses = licenses or {}
            
            SendReactMessage("setSelfData", {
                weight = exports.ox_inventory:GetPlayerWeight(),
                maxWeight = exports.ox_inventory:GetPlayerMaxWeight(),
                money = GetPlayerMoney(),
                job = {
                    name = ESX.PlayerData.job.name,
                    grade = ESX.PlayerData.job.grade
                },
                licenses = PlayerLicenses
            })
        end)
        
        -- Nur ShopItems senden wenn der Shop kaufbare Items hat
        if canBuy then
            SendReactMessage("setShopItems", shopItems)
        end
end

-- Funktion um Shop-Daten zu aktualisieren
local function UpdateShopData()
    if not ShopOpen then return end
    
    UpdatePlayerData() -- Das sendet bereits die Daten ans Frontend
end

-- Neue Funktion um Text-UI anzuzeigen
ShowShopText = function(shopData)
    local label = (shopData.target and shopData.target.label) or "Shop öffnen"
    local icon = (shopData.target and shopData.target.icon) or "fas fa-cash-register"
    lib.showTextUI('[E] - ' .. label, {
        position = "top-center",
        icon = icon
    })
end

-- Neue Funktion um Text-UI zu verstecken
HideShopText = function()
    lib.hideTextUI()
end

exports("OpenShop", function(type)
	openShop({ type = type })
end)


RegisterNuiCallback("purchaseItems", function(data, cb)
        if not data then
                lib.notify({ title = "Kauf fehlgeschlagen", description = "Beim Kauf ist ein Fehler aufgetreten.", type = "error" })
                return
        end

    local success = lib.callback.await("Paragon-Shops:Server:PurchaseItems", false, data)

        if not success then
                lib.notify({ title = "Kauf fehlgeschlagen", description = "Beim Kauf ist ein Fehler aufgetreten.", type = "error" })
        end

	UpdatePlayerData()
	SendReactMessage("setSelfData", {
		weight = exports.ox_inventory:GetPlayerWeight(),
		maxWeight = exports.ox_inventory:GetPlayerMaxWeight(),
		money = GetPlayerMoney(),
		licenses = GetPlayerLicenses()
	})

        cb(success)
end)

RegisterNuiCallback("getInventory", function(_, cb)
        if not CurrentShop then cb(0) return end
        local items = lib.callback.await('Paragon-Shops:Server:GetInventoryItems', false, CurrentShop.id)
        SendReactMessage('setInventoryItems', items)
        cb(1)
end)

RegisterNuiCallback("sellItem", function(data, cb)
        if not data or not data.name or not CurrentShop then cb(false) return end
        local success = lib.callback.await('Paragon-Shops:Server:SellItem', false, { name = data.name, shop = CurrentShop.id })
        if success then
                local items = lib.callback.await('Paragon-Shops:Server:GetInventoryItems', false, CurrentShop.id)
                SendReactMessage('setInventoryItems', items)
        end
        cb(success)
end)

RegisterNuiCallback("sellItems", function(data, cb)
        if not data or not data.items or not CurrentShop then cb(false) return end
        local success = lib.callback.await('Paragon-Shops:Server:SellItems', false, { items = data.items, shop = CurrentShop.id })
        if success then
                local items = lib.callback.await('Paragon-Shops:Server:GetInventoryItems', false, CurrentShop.id)
                SendReactMessage('setInventoryItems', items)
        end
        cb(success)
end)

RegisterNUICallback("startRobbery", function(_, cb)
        cb(1)
        if not CurrentShop then return end
        
        -- Prüfe ob Spieler eine Pistole hat
        local canRob = lib.callback.await('Paragon-Shops:Server:CanRobShop', false)
        if not canRob then
                lib.notify({ 
                        description = 'Du benötigst eine Pistole um diesen Shop auszurauben!', 
                        type = 'error' 
                })
                return
        end
        
        local remain = lib.callback.await('Paragon-Shops:Server:GetRobberyCooldown', false, CurrentShop.id, CurrentShop.location)
        if remain and remain > 0 then
                robberyCooldown = GetGameTimer() + remain
        end

        if GetGameTimer() < robberyCooldown then
                local r = math.ceil((robberyCooldown - GetGameTimer()) / 1000)
                lib.notify({ description = ('Du musst noch %s Sekunden warten.'):format(r), type = 'error' })
                return
        end

        TriggerServerEvent('Paragon-Shops:Server:RobberyStarted', CurrentShop.id, CurrentShop.location)

        local vendorKey = CurrentShop.id .. CurrentShop.location
        playFearAnim(Vendors[vendorKey])

        setShopVisible(false)
        Wait(100)
        local duration = config.robbery.duration or 10000
        CreateThread(function()
                Wait(duration + (config.robbery.cooldown or 60000))
                restoreVendorAnim(vendorKey)
        end)
        local shopCoords = LOCATIONS[CurrentShop.id].coords[CurrentShop.location]
        local origin = vector3(shopCoords.x, shopCoords.y, shopCoords.z)
        local startTime = GetGameTimer()
        local aborted = false

        isRobbing = true
        lib.showTextUI('[G] - Raub abbrechen', { position = 'top-center' })
        CreateThread(function()
                while isRobbing do
                        Wait(50) -- Performance optimiert: 50ms statt 0ms
                        if IsControlJustReleased(0, config.robbery.abortControl or 47) then
                                aborted = true
                                lib.cancelProgress()
                                break
                        end

                        if #(GetEntityCoords(cache.ped) - origin) > (config.robbery.maxDistance or 20.0) then
                                aborted = true
                                lib.cancelProgress()
                                break
                        end
                end
        end)

        lib.progressCircle({
                duration = duration,
                position = 'bottom',
                label = config.robbery.progressLabel or 'Raub läuft...'
        })

        lib.hideTextUI()
        isRobbing = false

        local elapsed = GetGameTimer() - startTime
        local progress = math.min(elapsed / duration, 1.0)
        if aborted then
                lib.notify({ description = 'Raub abgebrochen', type = 'error' })
        end
        TriggerServerEvent('Paragon-Shops:Server:RobberyReward', progress, CurrentShop.id, CurrentShop.location)
        robberyCooldown = GetGameTimer() + (config.robbery.cooldown or 60000)
end)

-- Frame Callbacks
RegisterNUICallback("Loaded", function(data, cb)
	cb(1)
	if not ESX.PlayerData or not ESX.PlayerData.identifier then return end
end)

RegisterNUICallback("hideFrame", function(_, cb)
        cb(1)
        setShopVisible(false)
        Wait(400)
        SendReactMessage("setCurrentShop", nil)
        CurrentShop = nil
end)

-- Hauptthread für Shop-Erstellung (ohne ox_target)
CreateThread(function()
    -- Warte bis ESX PlayerData vorhanden ist, um korrektes Job-Gating zu gewährleisten
    while not ESX or not ESX.PlayerData or not ESX.PlayerData.job do
        Wait(100)
    end
    BuildAllShops()
end)

-- Thread für E-Taste Erkennung - Performance optimiert
CreateThread(function()
        while true do
                local sleepTime = 100 -- Standard Sleep-Zeit für bessere Performance
                
                if next(NearbyShops) ~= nil and not ShopOpen and not isRobbing then
                        sleepTime = 0 -- Nur bei nahegelegenen Shops auf 0 setzen
                        
			if IsControlJustReleased(0, 38) then -- E-Taste
				-- Finde den nächsten Shop
				local playerCoords = GetEntityCoords(cache.ped)
				local closestShop = nil
				local closestDistance = math.huge

				for _, shopData in pairs(NearbyShops) do
					local shopCoords = LOCATIONS[shopData.shopID].coords[shopData.locationIndex]
					local distance = #(playerCoords - vector3(shopCoords.x, shopCoords.y, shopCoords.z))
					
					if distance < closestDistance then
						closestDistance = distance
						closestShop = shopData
					end
				end

				if closestShop then
					openShop({ type = closestShop.shopID, location = closestShop.locationIndex })
				end
			end
		end
		Wait(sleepTime)
	end
end)

-- ESX Events - Verbesserte Version für Cash-Probleme
RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(xPlayer)
    ESX.PlayerData = xPlayer
    UpdateShopData()
    robberyCooldown = 0
    BuildAllShops()
end)

RegisterNetEvent('esx:setJob')
AddEventHandler('esx:setJob', function(job)
    ESX.PlayerData.job = job
    UpdateShopData()
    BuildAllShops()
end)

-- Event für Lizenz-Updates (falls das System esx_license verwendet)
RegisterNetEvent('esx_license:addLicense')
AddEventHandler('esx_license:addLicense', function(type)
    -- Lade alle Lizenzen neu über unseren Server-Callback
    lib.callback('Paragon-Shops:Server:GetPlayerLicenses', false, function(licenses)
        if licenses then
            PlayerLicenses = licenses
            UpdateShopData()
        end
    end)
end)

RegisterNetEvent('esx_license:removeLicense')
AddEventHandler('esx_license:removeLicense', function(type)
    -- Lade alle Lizenzen neu über unseren Server-Callback
    lib.callback('Paragon-Shops:Server:GetPlayerLicenses', false, function(licenses)
        if licenses then
            PlayerLicenses = licenses
            UpdateShopData()
        end
    end)
end)

RegisterNetEvent('esx:setAccountMoney')
AddEventHandler('esx:setAccountMoney', function(account)
    -- Aktualisiere die lokalen PlayerData
    if ESX.PlayerData.accounts then
        for i=1, #ESX.PlayerData.accounts do
            if ESX.PlayerData.accounts[i].name == account.name then
                ESX.PlayerData.accounts[i].money = account.money
                break
            end
        end
    end
    
    -- Spezielle Behandlung für Cash
    if account.name == 'money' then
        ESX.PlayerData.money = account.money
    end
    
    UpdateShopData()
end)

-- Zusätzliche Events für Cash-Änderungen
RegisterNetEvent('esx:addedMoney')
AddEventHandler('esx:addedMoney', function(money)
    -- Aktualisiere sowohl PlayerData.money als auch den money account
    ESX.PlayerData.money = (ESX.PlayerData.money or 0) + money
    
    if ESX.PlayerData.accounts then
        for i=1, #ESX.PlayerData.accounts do
            if ESX.PlayerData.accounts[i].name == 'money' then
                ESX.PlayerData.accounts[i].money = ESX.PlayerData.accounts[i].money + money
                break
            end
        end
    end
    
    UpdateShopData()
end)

RegisterNetEvent('esx:removedMoney')
AddEventHandler('esx:removedMoney', function(money)
    -- Aktualisiere sowohl PlayerData.money als auch den money account
    ESX.PlayerData.money = (ESX.PlayerData.money or 0) - money
    
    if ESX.PlayerData.accounts then
        for i=1, #ESX.PlayerData.accounts do
            if ESX.PlayerData.accounts[i].name == 'money' then
                ESX.PlayerData.accounts[i].money = ESX.PlayerData.accounts[i].money - money
                break
            end
        end
    end
    
    UpdateShopData()
end)

-- Zusätzlicher Event für direkte Geld-Updates
RegisterNetEvent('esx:setMoney')
AddEventHandler('esx:setMoney', function(money)
    ESX.PlayerData.money = money
    
    if ESX.PlayerData.accounts then
        for i=1, #ESX.PlayerData.accounts do
            if ESX.PlayerData.accounts[i].name == 'money' then
                ESX.PlayerData.accounts[i].money = money
                break
            end
        end
    end
    
    UpdateShopData()
end)

AddEventHandler('ox_inventory:updateInventory', function()
	if not ShopOpen then return end
	SendReactMessage("setSelfData", {
		weight = exports.ox_inventory:GetPlayerWeight(),
		maxWeight = exports.ox_inventory:GetPlayerMaxWeight()
	})
end)

RegisterNetEvent('Paragon-Shops:Client:SetSocietyMoney')
AddEventHandler('Paragon-Shops:Client:SetSocietyMoney', function(amount)
    societyMoney = amount
    UpdateShopData()
end)

AddEventHandler('onResourceStop', function(resource)
	if resource ~= GetCurrentResourceName() then return end

	for _, entity in pairs(Vendors) do
		if DoesEntityExist(entity) then
			if IsModelAPed(GetEntityModel(entity)) then
				DeletePed(entity)
			else
				DeleteObject(entity)
			end
		end
	end

	for _, point in ipairs(Points) do
		point:remove()
	end

        for _, blip in ipairs(Blips) do
                RemoveBlip(blip)
        end

        for _, blip in ipairs(DispatchBlips) do
                RemoveBlip(blip)
        end

	-- Text-UI verstecken beim Resource-Stop
        HideShopText()
end)

RegisterNetEvent('Paragon-Shops:Client:PoliceDispatch')
AddEventHandler('Paragon-Shops:Client:PoliceDispatch', function(coords)
    if ESX.PlayerData.job and ESX.PlayerData.job.name == 'police' then
        local street = GetStreetNameFromHashKey(GetStreetNameAtCoord(coords.x, coords.y, coords.z))
        lib.notify({
            title = 'Ladenüberfall',
            description = ('Ein Shop wird überfallen in der Nähe von %s'):format(street),
            type = 'info'
        })

        local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
        SetBlipSprite(blip, 161)
        SetBlipScale(blip, 1.2)
        SetBlipColour(blip, 3)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentString('Shop Raub')
        EndTextCommandSetBlipName(blip)
        DispatchBlips[#DispatchBlips + 1] = blip
        CreateThread(function()
            Wait(60000)
            if DoesBlipExist(blip) then
                RemoveBlip(blip)
            end
        end)
    end
end)

-- Debug-Commands für Lizenz-Tests (entfernt für Produktion)
-- RegisterCommand('giveweaponlicense', function()
--     PlayerLicenses.weapon = true
--     lib.notify({ title = "Debug", description = "Weapon license added", type = "success" })
--     if ShopOpen then
--         UpdateShopData()
--     end
-- end, false)

-- RegisterCommand('removeweaponlicense', function()
--     PlayerLicenses.weapon = false
--     lib.notify({ title = "Debug", description = "Weapon license removed", type = "error" })
--     if ShopOpen then
--         UpdateShopData()
--     end
-- end, false)

-- RegisterCommand('checklicenses', function()
--     lib.notify({ 
--         title = "Debug", 
--         description = "Check console for license info", 
--         type = "info" 
--     })
--     lib.callback('Paragon-Shops:Server:GetPlayerLicenses', false, function(licenses)
--         if licenses then
--             PlayerLicenses = licenses
--         end
--     end)
-- end, false)
