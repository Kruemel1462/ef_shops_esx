---@class ShopConfig
---@field debug boolean whether or not debug messages/zones should be enabled
---@field fluctuatePrices boolean whether or not prices should fluctuate when the shop is restocked (registered)
return {
        debug = false,
        fluctuatePrices = true,
        robbery = {
                duration = 15000,
                reward = 500
        }
}
