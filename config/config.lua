---@class ShopConfig
---@field debug boolean whether or not debug messages/zones should be enabled
---@field fluctuatePrices boolean whether or not prices should fluctuate when the shop is restocked (registered)
return {
        debug = false,
        fluctuatePrices = true,
        logWebhook = '', -- Discord webhook URL for purchase/sale logs
        robbery = {
                duration = 15000,
                reward = 500,
                cooldown = 300000,
                maxDistance = 20.0,
                abortControl = 47,
                dispatchChance = 0.5, -- 50% chance police gets a dispatch on robbery start
                progressLabel = 'Raub läuft...'
        }
}
