---@class ShopLocation
---@field label string the label of the shop location
---@field coords? vector3[] | vector4[] coordinates of shop locations (can be omitted if you only want to open the shop using an external resource)
---@field model? number[] | string[] | number | string hash of model (ped/object) to pick from when spawning a shop vendor
---@field shopItems? string which table to pull shop items from
---@field sellItems? string[] | number[] items to sell
---@field blip? { sprite: number, color: number, scale?: number, disabled?: boolean } blip data for the shop
---@field jobs? table<string, number> map of group names to min grade required to access the shop
---@field societies? table<string, number | string> society names mapped to required rank to pay with society funds
---@field target? { label?: string, radius?: number, icon?: string } target data for the shop

---@type table<string, ShopLocation>
return {

--[SUPERMARKET]
	supermarket = {
		label = "24/7 Supermarket",
		model = {
			"S_M_M_LifeInvad_01"
		},
		coords = {
			vector4(24.50, -1347.20, 29.50, 265.97),
			vector4(372.59, 326.41, 103.57, 256.50),
			vector4(2557.11, 380.78, 108.62, 357.18),
			vector4(-3038.96, 584.47, 7.91, 21.68),
			vector4(-3242.39, 999.86, 12.83, 357.83),
			vector4(1727.76, 6415.25, 35.04, 239.78),
			vector4(1697.36, 4923.37, 42.06, 327.93),
			vector4(1960.00, 3740.05, 32.34, 301.14),
			vector4(2677.95, 3279.37, 55.24, 328.84),
			vector4(549.05, 2671.31, 42.16, 92.96)
		},
		shopItems = "supermarket",
		blip = {
			sprite = 606,
			color = 7,
			scale = 0.8
		},
	},

--[AMMUNATION]
	ammunation = {
		label = "Ammunation",
		model = {
			"S_M_M_LifeInvad_01"
		},
		coords = {
			vector4(810.12, -2159.01, 29.62, 1.49),
			vector4(-662.01, -933.59, 21.83, 182.18),
			vector4(1692.56, 3761.22, 34.71, 226.76),
			vector4(-331.58, 6084.96, 31.45, 227.85),
			vector4(253.84, -50.69, 69.94, 72.91),
			vector4(22.90, -1105.58, 29.80, 158.07),
			vector4(2567.68, 292.63, 108.73, 359.64),
			vector4(-1118.76, 2699.98, 18.55, 222.86),
			vector4(842.18, -1035.31, 28.19, 1.34)
		},
		shopItems = "ammunation",

	},

--[POLICE]
	PoliceArmoury = {
		label = "Police Armoury",
		coords = {
			vector4(816.28, -1295.71, 19.85, 81.78)
		},
		shopItems = "police",
		jobs = {
			["police"] = 0,
		}
	},
}
