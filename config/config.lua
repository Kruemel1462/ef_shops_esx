---@class ShopConfig
---@field debug boolean whether or not debug messages/zones should be enabled
---@field fluctuatePrices boolean whether or not prices should fluctuate when the shop is restocked (registered)
return {
        debug = false,
        fluctuatePrices = true,
        logWebhook = '', -- Discord webhook URL for purchase/sale logs (fallback)
        
        -- Discord Logging Konfiguration
        discord = {
                enabled = true, -- Discord Logging aktivieren/deaktivieren
                webhooks = {
                        purchases = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB', -- Webhook für Käufe
                        sales = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB', -- Webhook für Verkäufe
                        security = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB', -- Webhook für Sicherheitsereignisse
                        admin = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB', -- Webhook für Admin-Aktionen
                        performance = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB', -- Webhook für Performance-Alerts
                        general = 'https://discord.com/api/webhooks/1390684882690117682/fEIZmkjf_wR8xfxP942x8PooInXc7RRx81BquQXyDBEJetoBbbalsZuc-sJEcyWHw0jB' -- Webhook für allgemeine Events
                }
        },
        
        -- Performance Einstellungen
        performance = {
                vendorRenderDistance = 25.0, -- Distanz für Vendor-Spawning
                interactionDistance = 2.0, -- Distanz für Shop-Interaktion
                threadSleepTime = 100, -- Standard Thread Sleep-Zeit (ms)
                maxConcurrentPurchases = 3, -- Max gleichzeitige Käufe pro Spieler
                enableMonitoring = true, -- Performance Monitoring aktivieren
                thresholds = { -- Performance Schwellenwerte (ms)
                        database_query = 50,
                        shop_open = 100,
                        purchase_transaction = 200,
                        inventory_check = 30,
                        license_check = 25,
                        cache_operation = 5
                }
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
                notificationDuration = 3000, -- Notification Dauer (ms) - verkürzt für bessere UX
                enableKeyboardShortcuts = true, -- Keyboard Shortcuts aktivieren
                enableQuickBuy = true, -- Doppelklick für 5x kaufen
                showHelpButton = true, -- Hilfe-Button anzeigen
                enableBulkActions = true, -- Bulk-Aktionen im Warenkorb
                quickSearchShortcuts = true -- !waffe, !essen etc. Shortcuts
        },
        
        robbery = {
                duration = 15000,
                reward = 500,
                cooldown = 300000,
                maxDistance = 20.0,
                abortControl = 47,
                dispatchChance = 0.5, -- 50% chance police gets a dispatch on robbery start
                progressLabel = 'Raub läuft...',
                -- Shops bei denen Ausrauben deaktiviert ist
                disabledShops = {
                        "supermarket",
                        "ammunation",
                        "PoliceArmoury",
                }
        }
}
