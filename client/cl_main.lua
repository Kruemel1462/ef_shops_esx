if not lib.checkDependency('ox_lib', '3.0.0') then error() end
if not lib.checkDependency('ox_inventory', '2.20.0') then error() end

-- ESX Initialisierung
ESX = exports['es_extended']:getSharedObject()

local config = require 'config.config'

local PRODUCTS = require 'config.shop_items' ---@type table<string, table<string, ShopItem>>
local LOCATIONS = require 'config.locations' ---@type type<string, ShopLocation>

local ITEMS = exports.ox_inventory:Items()

local Vendors = {}
local Points = {}
local Blips = {}
local NearbyShops = {} -- Neue Tabelle für nahegelegene Shops

ShopOpen = false
local societyMoney = 0
local CurrentShop
local robberyCooldown = 0
local isRobbing = false

local scenarios = {
	"WORLD_HUMAN_VALET",
	"WORLD_HUMAN_AA_COFFEE",
	"WORLD_HUMAN_GUARD_STAND_CASINO",
	"WORLD_HUMAN_GUARD_PATROL",
	"PROP_HUMAN_STAND_IMPATIENT",
}

local function setShopVisible(shouldShow)
	ShopOpen = shouldShow
	SetNuiFocus(shouldShow, shouldShow)
	SendReactMessage("setVisible", shouldShow)
end

-- Hilfsfunktion um PlayerData zu aktualisieren
local function UpdatePlayerData()
	ESX.PlayerData = ESX.GetPlayerData()
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
    
    return {
        Cash = cashMoney,
        Bank = bankMoney,
        Society = societyMoney
    }
end

-- Hilfsfunktion um Lizenzen zu holen
local function GetPlayerLicenses()
	local licenses = {}
	ESX.TriggerServerCallback('esx_license:checkLicense', function(hasLicense)
		-- Hier könntest du verschiedene Lizenzen prüfen
	end, GetPlayerServerId(PlayerId()), 'weapon')
	
	-- Fallback für einfache Lizenzprüfung
	return ESX.PlayerData.licenses or {}
end

---@param data { type: string, location?: number }
local function openShop(data)
	if not data.location then data.location = 1 end

	lib.print.debug("Opening shop: " .. data.type, "Location: " .. data.location)

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

        for _, item in pairs(shopItems) do
		local productData = PRODUCTS[shopData.shopItems][item.id]

		item.label = productData.metadata?.label or ITEMS[item.name]?.label
		item.weight = productData.metadata?.weight or ITEMS[item.name]?.weight
		item.category = productData.category
		item.imagePath = productData.metadata?.imageurl or GetItemIcon(item.name)
		item.jobs = productData.jobs
        end

        societyMoney = lib.callback.await('Paragon-Shops:Server:GetSocietyMoney', false, data.type)

        UpdatePlayerData()

	SendReactMessage("setSelfData", {
		weight = exports.ox_inventory:GetPlayerWeight(),
		maxWeight = exports.ox_inventory:GetPlayerMaxWeight(),
		money = GetPlayerMoney(),
		job = {
			name = ESX.PlayerData.job.name,
			grade = ESX.PlayerData.job.grade
		},
		licenses = GetPlayerLicenses()
	})
        CurrentShop = { id = data.type, location = data.location }
        SendReactMessage("setCurrentShop", { id = data.type, location = data.location, label = LOCATIONS[data.type].label })
        SendReactMessage("setShopItems", shopItems)
end

-- Funktion um Shop-Daten zu aktualisieren
local function UpdateShopData()
    if not ShopOpen then return end
    
    UpdatePlayerData()
    SendReactMessage("setSelfData", {
        weight = exports.ox_inventory:GetPlayerWeight(),
        maxWeight = exports.ox_inventory:GetPlayerMaxWeight(),
        money = GetPlayerMoney(),
        job = {
            name = ESX.PlayerData.job.name,
            grade = ESX.PlayerData.job.grade
        },
        licenses = GetPlayerLicenses()
    })
end

-- Neue Funktion um Text-UI anzuzeigen
local function ShowShopText(shopData)
    lib.showTextUI('[E] - ' .. (shopData.target?.label or "Shop öffnen"), {
        position = "top-center",
        icon = shopData.target?.icon or "fas fa-cash-register"
    })
end

-- Neue Funktion um Text-UI zu verstecken
local function HideShopText()
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

RegisterNUICallback("startRobbery", function(_, cb)
        cb(1)
        local remain = lib.callback.await('Paragon-Shops:Server:GetRobberyCooldown', false)
        if remain and remain > 0 then
                robberyCooldown = GetGameTimer() + remain
        end

        if GetGameTimer() < robberyCooldown then
                local r = math.ceil((robberyCooldown - GetGameTimer()) / 1000)
                lib.notify({ description = ('Du musst noch %s Sekunden warten.'):format(r), type = 'error' })
                return
        end

        if not CurrentShop then return end

        TriggerServerEvent('Paragon-Shops:Server:RobberyStarted', CurrentShop.id, CurrentShop.location)

        setShopVisible(false)
        Wait(100)
        local duration = config.robbery.duration or 10000
        local shopCoords = LOCATIONS[CurrentShop.id].coords[CurrentShop.location]
        local origin = vector3(shopCoords.x, shopCoords.y, shopCoords.z)
        local startTime = GetGameTimer()
        local aborted = false

        isRobbing = true
        lib.showTextUI('[G] - Raub abbrechen', { position = 'top-center' })
        CreateThread(function()
                while isRobbing do
                        Wait(0)
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
        TriggerServerEvent('Paragon-Shops:Server:RobberyReward', progress)
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
	for shopID, storeData in pairs(LOCATIONS) do
		if not storeData.coords then goto continue end

		for locationIndex, locationCoords in pairs(storeData.coords) do
			-- Blip erstellen
			if not storeData.blip or not storeData.blip.disabled then
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
						TaskStartScenarioInPlace(Vendors[shopID .. locationIndex], storeData.scenario or scenarios[math.random(1, #scenarios)], -1, true)
						SetBlockingOfNonTemporaryEvents(Vendors[shopID .. locationIndex], true)
						SetEntityNoCollisionEntity(Vendors[shopID .. locationIndex], cache.ped, false)
						FreezeEntityPosition(Vendors[shopID .. locationIndex], true)
					end

					function deleteEntity()
						if DoesEntityExist(Vendors[shopID .. locationIndex]) then
							DeletePed(Vendors[shopID .. locationIndex])
						end
					end
				else
					function createEntity()
						Vendors[shopID .. locationIndex] = CreateObject(model, locationCoords.x, locationCoords.y, locationCoords.z - 1.03, false, false, false)
						SetEntityHeading(Vendors[shopID .. locationIndex], locationCoords.w)
						FreezeEntityPosition(Vendors[shopID .. locationIndex], true)
					end

					function deleteEntity()
						if DoesEntityExist(Vendors[shopID .. locationIndex]) then
							DeleteEntity(Vendors[shopID .. locationIndex])
						end
					end
				end

				-- Point System für Nähe-Erkennung
				local point = lib.points.new(locationCoords, 25)
				function point:onEnter()
					if not Vendors[shopID .. locationIndex] or (Vendors[shopID .. locationIndex] and not DoesEntityExist(Vendors[shopID .. locationIndex])) then
						while not HasModelLoaded(model) do
							pcall(function()
								lib.requestModel(model)
							end)
						end
						createEntity()
					end
				end

				function point:onExit()
					deleteEntity()
				end

				-- Nähe-Punkt für E-Taste Interaktion
				local interactionPoint = lib.points.new(locationCoords, storeData.target?.radius or 2.0)
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
				local interactionPoint = lib.points.new(locationCoords, storeData.target?.radius or 2.0)
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
end)

-- Thread für E-Taste Erkennung
CreateThread(function()
        while true do
                if next(NearbyShops) ~= nil and not ShopOpen and not isRobbing then
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
		Wait(0)
	end
end)

-- ESX Events - Verbesserte Version für Cash-Probleme
RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(xPlayer)
    ESX.PlayerData = xPlayer
    UpdateShopData()
    local remain = lib.callback.await('Paragon-Shops:Server:GetRobberyCooldown', false)
    if remain and remain > 0 then
        robberyCooldown = GetGameTimer() + remain
    end
end)

RegisterNetEvent('esx:setJob')
AddEventHandler('esx:setJob', function(job)
    ESX.PlayerData.job = job
    UpdateShopData()
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
            type = 'inform'
        })
    end
end)
