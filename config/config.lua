---@class ShopConfig
---@field debug boolean whether or not debug messages/zones should be enabled
---@field fluctuatePrices boolean whether or not prices should fluctuate when the shop is restocked (registered)
return {
        debug = false,
        fluctuatePrices = true,
        logWebhook = '', -- Discord webhook URL for purchase/sale logs
        
        -- Performance Einstellungen
        performance = {
                vendorRenderDistance = 25.0, -- Distanz für Vendor-Spawning
                interactionDistance = 2.0, -- Distanz für Shop-Interaktion
                threadSleepTime = 100, -- Standard Thread Sleep-Zeit (ms)
                maxConcurrentPurchases = 3 -- Max gleichzeitige Käufe pro Spieler
        },
        
        -- Sicherheits-Einstellungen
        security = {
                enableRateLimit = true, -- Rate Limiting aktivieren
                maxPurchasesPerMinute = 10, -- Max Käufe pro Minute pro Spieler
                validatePrices = true, -- Preisvalidierung aktivieren
                logSuspiciousActivity = true, -- Verdächtige Aktivitäten loggen
                maxItemsPerPurchase = 50 -- Max Items pro Kauf
        },
        
        -- UI Einstellungen
        ui = {
                showLoadingStates = true, -- Loading States anzeigen
                enableAnimations = true, -- Animationen aktivieren
                autoCloseAfterPurchase = false, -- Shop nach Kauf automatisch schließen
                notificationDuration = 5000 -- Notification Dauer (ms)
        },
        
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
