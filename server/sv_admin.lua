-- Admin Commands für Paragon Shops
-- Provides administrative tools for monitoring and debugging

local Logger = require 'shared.sh_logging'
local PerformanceMonitor = require 'shared.sh_performance'
local config = require 'config.config'

-- Initialize logger and performance monitor
local logger = Logger.new("Admin")
local perfMonitor = PerformanceMonitor.new("Admin")

-- Admin permission check
local function isAdmin(source)
    -- Check if player is admin (customize this based on your admin system)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    
    -- Example: Check for admin group or specific job
    return xPlayer.getGroup() == 'admin' or xPlayer.job.name == 'admin'
end

-- Performance Report Command
RegisterCommand('shops:performance', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    local report = perfMonitor:generateReport()
    local healthy, healthMessage = perfMonitor:checkHealth()
    
    if source == 0 then
        -- Server console
        print("^2=== Paragon Shops Performance Report ===^7")
        print(report)
        print("^3Health Status: " .. healthMessage .. "^7")
    else
        -- Player
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Performance Report",
            description = "Check server console for detailed report",
            type = "info"
        })
        
        -- Send to player's console
        TriggerClientEvent('chat:addMessage', source, {
            color = {0, 255, 0},
            multiline = true,
            args = {"Performance Report", report .. "\n\nHealth: " .. healthMessage}
        })
    end
    
    logger:info("Performance report generated", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source),
        healthy = healthy
    })
    
    -- Discord Logging
    if DiscordLogger then
        DiscordLogger.LogAdminAction(source, "Performance Report", nil, "Generated performance report - Health: " .. healthMessage)
    end
end, true)

-- Reset Performance Metrics Command
RegisterCommand('shops:resetperf', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    perfMonitor:reset()
    
    local message = "Performance metrics reset successfully"
    if source == 0 then
        print("^2" .. message .. "^7")
    else
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Performance Reset",
            description = message,
            type = "success"
        })
    end
    
    logger:info("Performance metrics reset", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source)
    })
end, true)

-- Shop Statistics Command
RegisterCommand('shops:stats', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    local shopCount = 0
    local locationCount = 0
    
    for shopId, shopData in pairs(ShopData or {}) do
        shopCount = shopCount + 1
        for locationId, _ in pairs(shopData) do
            locationCount = locationCount + 1
        end
    end
    
    local stats = {
        "=== Shop Statistics ===",
        "Total Shop Types: " .. shopCount,
        "Total Locations: " .. locationCount,
        "Active Players: " .. #GetPlayers(),
        "Server Uptime: " .. math.floor(GetGameTimer() / 1000 / 60) .. " minutes"
    }
    
    local statsText = table.concat(stats, "\n")
    
    if source == 0 then
        print("^2" .. statsText .. "^7")
    else
        TriggerClientEvent('chat:addMessage', source, {
            color = {0, 255, 0},
            multiline = true,
            args = {"Shop Statistics", statsText}
        })
    end
    
    logger:info("Shop statistics requested", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source),
        shopCount = shopCount,
        locationCount = locationCount
    })
end, true)

-- Cache Statistics Command
RegisterCommand('shops:cache', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    -- Count cache entries (assuming licenseCache is accessible)
    local cacheCount = 0
    local expiredCount = 0
    local now = os.time()
    
    -- This would need to be implemented based on your cache structure
    -- For now, just show a placeholder
    local cacheStats = {
        "=== Cache Statistics ===",
        "License Cache Entries: " .. cacheCount,
        "Expired Entries: " .. expiredCount,
        "Cache Hit Rate: N/A", -- Would need to track this
        "Last Cleanup: N/A"
    }
    
    local statsText = table.concat(cacheStats, "\n")
    
    if source == 0 then
        print("^3" .. statsText .. "^7")
    else
        TriggerClientEvent('chat:addMessage', source, {
            color = {255, 255, 0},
            multiline = true,
            args = {"Cache Statistics", statsText}
        })
    end
    
    logger:info("Cache statistics requested", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source)
    })
end, true)

-- Debug Player Data Command
RegisterCommand('shops:debug', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    local targetId = tonumber(args[1])
    if not targetId then
        local message = "Usage: /shops:debug <player_id>"
        if source == 0 then
            print("^1" .. message .. "^7")
        else
            TriggerClientEvent('ox_lib:notify', source, {
                title = "Invalid Usage",
                description = message,
                type = "error"
            })
        end
        return
    end
    
    local xPlayer = ESX.GetPlayerFromId(targetId)
    if not xPlayer then
        local message = "Player not found: " .. targetId
        if source == 0 then
            print("^1" .. message .. "^7")
        else
            TriggerClientEvent('ox_lib:notify', source, {
                title = "Player Not Found",
                description = message,
                type = "error"
            })
        end
        return
    end
    
    local inv = exports.ox_inventory:GetInventory(targetId) or {}
    local weightText = (inv.weight or 0) .. "/" .. ((inv.maxWeight or 0))

    local debugInfo = {
        "=== Player Debug Info ===",
        "Player: " .. GetPlayerName(targetId) .. " (" .. targetId .. ")",
        "Identifier: " .. xPlayer.identifier,
        "Job: " .. xPlayer.job.name .. " (Grade: " .. xPlayer.job.grade .. ")",
        "Money: $" .. xPlayer.getMoney(),
        "Bank: $" .. (xPlayer.getAccount('bank') and xPlayer.getAccount('bank').money or 0),
        "Inventory Weight: " .. weightText
    }
    
    local debugText = table.concat(debugInfo, "\n")
    
    if source == 0 then
        print("^6" .. debugText .. "^7")
    else
        TriggerClientEvent('chat:addMessage', source, {
            color = {0, 255, 255},
            multiline = true,
            args = {"Player Debug", debugText}
        })
    end
    
    logger:info("Player debug info requested", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source),
        targetPlayer = GetPlayerName(targetId),
        targetId = targetId
    })
end, true)

-- Reload Configuration Command
RegisterCommand('shops:reload', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    -- Trigger server-side config reload and shop reinitialization
    TriggerEvent('Paragon-Shops:Server:ReloadConfig')
    local message = "Configuration reloaded successfully"
    
    if source == 0 then
        print("^3" .. message .. "^7")
    else
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Reload Config",
            description = message,
            type = "info"
        })
    end
    
    logger:info("Configuration reload executed", {
        requestedBy = source == 0 and "Console" or GetPlayerName(source)
    })
    if DiscordLogger then
        DiscordLogger.LogAdminAction(source, 'Reload Config', nil, 'Executed /shops:reload')
    end
end, true)

-- Help Command
RegisterCommand('shops:help', function(source, args)
    if source ~= 0 and not isAdmin(source) then
        TriggerClientEvent('ox_lib:notify', source, {
            title = "Berechtigung fehlt",
            description = "Du hast keine Berechtigung für diesen Befehl.",
            type = "error"
        })
        return
    end
    
    local helpText = {
        "=== Paragon Shops Admin Commands ===",
        "/shops:performance - Show performance report",
        "/shops:resetperf - Reset performance metrics",
        "/shops:stats - Show shop statistics",
        "/shops:cache - Show cache statistics",
        "/shops:debug <player_id> - Debug player data",
        "/shops:reload - Reload configuration",
        "/shops:help - Show this help"
    }
    
    local help = table.concat(helpText, "\n")
    
    if source == 0 then
        print("^2" .. help .. "^7")
    else
        TriggerClientEvent('chat:addMessage', source, {
            color = {0, 255, 0},
            multiline = true,
            args = {"Admin Help", help}
        })
    end
end, true)

logger:info("Admin commands loaded successfully")
