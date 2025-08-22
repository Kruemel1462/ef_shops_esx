---@class ShopItem
---@field id? number internal id number, do not set
---@field name? string item name as referenced in ox_inventory
---@field price number base price of the item
---@field defaultStock? integer the amount of items available in the shop by default
---@field category? string the category of the item in the shop (e.g. 'Snacks', 'Tools', 'Firearms', 'Ammunition', 'Drinks')
---@field license? string the license required to purchase the item
---@field jobs? table<string, number> map of group names to min grade required to access the shop
---@field metadata? table | string metadata for item

---@type table<string, table<string | number, ShopItem>>
local ITEMS = {
	supermarket = {
		{ name = 'hotdog', price = 10, category = 'Essen' },
		{ name = 'soda', price = 10, category = 'Trinken' },
		{ name = 'sprunk', price = 10, category = 'Trinken' },
	},

	ammunation = {
		{ name = 'WEAPON_KNIFE', price = 80, category = 'Nahkampf' },
		{ name = 'WEAPON_BAT', price = 45, category = 'Nahkampf' },
		{ name = 'WEAPON_NIGHTSTICK', price = 500, category = 'Nahkampf' },
		{ name = 'WEAPON_KNUCKLE', price = 950, category = 'Nahkampf' },
		{ name = 'WEAPON_PISTOL', price = 2450, license = "weapon", category = 'Feuerwaffen' },
		{ name = 'WEAPON_SNSPISTOL', price = 1850, license = "weapon", category = 'Feuerwaffen' },
		{ name = 'ammo-9', price = 4, license = "weapon", category = 'Munition' },
		{ name = 'ammo-45', price = 7, license = "weapon", category = 'Munition' },
	},
	
	police = {
		{ name = 'ammo-9', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Munition' },
		{ name = 'ammo-rifle', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Munition' },
		{ name = 'WEAPON_FLASHLIGHT', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Ausrüstung' },
		{ name = 'WEAPON_PUMPSHOTGUN_MK2', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Feuerwaffen' },
		{ name = 'WEAPON_SMG', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Feuerwaffen' },
		{ name = 'WEAPON_PISTOL_MK2', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Feuerwaffen' },
		{ name = 'WEAPON_TACTICALRIFLE', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Feuerwaffen' },
		{ name = 'WEAPON_HEAVYRIFLE', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Feuerwaffen' },
		{ name = 'WEAPON_STUNGUN', price = 0, license = "weapon", metadata = {serial = "POL"}, category = 'Ausrüstung' },
	},
	-- bar = {
	-- 	{ name = 'water_bottle', price = 1, defaultStock = 50, category = 'Drinks' },
	-- 	{ name = 'beer', price = 6, defaultStock = 50, category = 'Alcohol' },
	-- 	{ name = 'whiskey', price = 20, defaultStock = 50, category = 'Alcohol' },
	-- 	{ name = 'vodka', price = 12, defaultStock = 50, category = 'Alcohol' }
	-- },
	
	-- hardware = {
	-- 	{ name = 'lockpick', price = 20, defaultStock = 50, category = 'Tools' },
	-- 	{ name = 'screwdriver', price = 15, defaultStock = 50, category = 'Tools' },
	-- 	{ name = 'hammer', price = 25, defaultStock = 50, category = 'Tools' },
	-- },

}

local newFormatItems = {}
for category, categoryItems in pairs(ITEMS) do
	local newCategoryItems = {}

	for item, data in pairs(categoryItems) do
		if not data.name then
			data.name = tostring(item)
		end

		newCategoryItems[#newCategoryItems + 1] = data
	end

	table.sort(newCategoryItems, function(a, b)
		return a.name < b.name
	end)

	newFormatItems[category] = newCategoryItems
end

return newFormatItems
