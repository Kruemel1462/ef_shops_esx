-- Discord Logging System für Paragon Shops
-- Umfassendes Logging aller Shop-Aktivitäten für Admins

local Logger = require 'shared.sh_logging'
local config = require 'config.config'

local logger = Logger.new("DiscordLogger")

-- Discord Webhook URLs (in config.lua konfigurieren)
local WEBHOOKS = {
    purchases = config.discord and config.discord.webhooks and config.discord.webhooks.purchases or '',
    sales = config.discord and config.discord.webhooks and config.discord.webhooks.sales or '',
    security = config.discord and config.discord.webhooks and config.discord.webhooks.security or '',
    admin = config.discord and config.discord.webhooks and config.discord.webhooks.admin or '',
    performance = config.discord and config.discord.webhooks and config.discord.webhooks.performance or '',
    general = config.discord and config.discord.webhooks and config.discord.webhooks.general or config.logWebhook or ''
}

-- Discord Embed Colors
local COLORS = {
    SUCCESS = 3066993,    -- Green
    WARNING = 15105570,   -- Orange
    ERROR = 15158332,     -- Red
    INFO = 3447003,       -- Blue
    SECURITY = 10181046,  -- Purple
    MONEY = 15844367,     -- Gold
    ADMIN = 2123412       -- Dark Blue
}

-- Helper function to get player info
local function getPlayerInfo(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return {
            name = GetPlayerName(source) or "Unknown",
            identifier = "Unknown",
            job = "Unknown",
            money = 0,
            bank = 0
        }
    end
    
    return {
        name = GetPlayerName(source) or "Unknown",
        identifier = xPlayer.identifier or "Unknown",
        job = (xPlayer.job and xPlayer.job.name or "Unknown") .. " (" .. (xPlayer.job and xPlayer.job.grade or 0) .. ")",
        money = xPlayer.getMoney() or 0,
        bank = (xPlayer.getAccount('bank') and xPlayer.getAccount('bank').money) or 0
    }
end

-- Helper function to format money
local function formatMoney(amount)
    return "$" .. tostring(amount)
end

-- Helper function to send webhook
local function sendWebhook(webhookType, embed)
    local webhookUrl = WEBHOOKS[webhookType] or WEBHOOKS.general
    if not webhookUrl or webhookUrl == '' then
        logger:warn("No webhook URL configured for type: " .. webhookType)
        return
    end
    
    local payload = json.encode({
        username = 'Paragon Shops Logger',
        avatar_url = 'https://i.imgur.com/4M34hi2.png', -- Optional: Shop icon
        embeds = {embed}
    })
    
    PerformHttpRequest(webhookUrl, function(statusCode, response)
        if statusCode ~= 200 and statusCode ~= 204 then
            logger:error("Failed to send webhook", {
                type = webhookType,
                statusCode = statusCode,
                response = response
            })
        end
    end, 'POST', payload, {['Content-Type'] = 'application/json'})
end

-- Purchase Logging
function LogPurchase(source, shopData, items, totalPrice, currency)
    local playerInfo = getPlayerInfo(source)
    local itemList = {}
    
    for _, item in ipairs(items) do
        table.insert(itemList, string.format("• %dx %s", item.quantity, item.name))
    end
    
    local embed = {
        title = "🛒 Shop Purchase",
        color = COLORS.SUCCESS,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "👤 Player",
                value = string.format("**%s**\n`%s`", playerInfo.name, playerInfo.identifier),
                inline = true
            },
            {
                name = "🏪 Shop",
                value = string.format("**%s**\nLocation: %s", shopData.label or shopData.id, shopData.location or "1"),
                inline = true
            },
            {
                name = "💰 Payment",
                value = string.format("**%s**\nMethod: %s", formatMoney(totalPrice), currency:upper()),
                inline = true
            },
            {
                name = "📦 Items Purchased",
                value = table.concat(itemList, "\n"),
                inline = false
            },
            {
                name = "💳 Player Balance After",
                value = string.format("Cash: %s\nBank: %s", formatMoney(playerInfo.money), formatMoney(playerInfo.bank)),
                inline = true
            },
            {
                name = "👔 Job",
                value = playerInfo.job,
                inline = true
            }
        },
        footer = {
            text = "Paragon Shops v1.5.0",
            icon_url = "https://i.imgur.com/4M34hi2.png"
        }
    }
    
    sendWebhook('purchases', embed)
end

-- Sale Logging
function LogSale(source, shopData, items, totalPrice)
    local playerInfo = getPlayerInfo(source)
    local itemList = {}
    
    for _, item in ipairs(items) do
        table.insert(itemList, string.format("• %dx %s", item.quantity, item.name))
    end
    
    local embed = {
        title = "💰 Item Sale",
        color = COLORS.MONEY,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "👤 Player",
                value = string.format("**%s**\n`%s`", playerInfo.name, playerInfo.identifier),
                inline = true
            },
            {
                name = "🏪 Shop",
                value = string.format("**%s**\nLocation: %s", shopData and shopData.label or "Unknown", shopData and shopData.location or "Unknown"),
                inline = true
            },
            {
                name = "💰 Earned",
                value = formatMoney(totalPrice),
                inline = true
            },
            {
                name = "📦 Items Sold",
                value = table.concat(itemList, "\n"),
                inline = false
            },
            {
                name = "💳 Player Balance After",
                value = string.format("Cash: %s\nBank: %s", formatMoney(playerInfo.money), formatMoney(playerInfo.bank)),
                inline = true
            },
            {
                name = "👔 Job",
                value = playerInfo.job,
                inline = true
            }
        },
        footer = {
            text = "Paragon Shops v1.5.0"
        }
    }
    
    sendWebhook('sales', embed)
end

-- Security Event Logging
function LogSecurityEvent(source, eventType, details, severity)
    local playerInfo = getPlayerInfo(source)
    local color = COLORS.SECURITY
    
    if severity == "critical" then
        color = COLORS.ERROR
    elseif severity == "warning" then
        color = COLORS.WARNING
    end
    
    local embed = {
        title = "🚨 Security Alert",
        color = color,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "⚠️ Event Type",
                value = eventType,
                inline = true
            },
            {
                name = "📊 Severity",
                value = severity:upper(),
                inline = true
            },
            {
                name = "👤 Player",
                value = string.format("**%s**\n`%s`", playerInfo.name, playerInfo.identifier),
                inline = false
            },
            {
                name = "📝 Details",
                value = details,
                inline = false
            },
            {
                name = "👔 Job",
                value = playerInfo.job,
                inline = true
            },
            {
                name = "🕐 Server Time",
                value = os.date("%Y-%m-%d %H:%M:%S"),
                inline = true
            }
        },
        footer = {
            text = "Immediate admin attention may be required"
        }
    }
    
    sendWebhook('security', embed)
end

-- Admin Action Logging
function LogAdminAction(source, action, target, details)
    local adminInfo = getPlayerInfo(source)
    local targetInfo = target and getPlayerInfo(target) or nil
    
    local embed = {
        title = "👮‍♂️ Admin Action",
        color = COLORS.ADMIN,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "👤 Admin",
                value = string.format("**%s**\n`%s`", adminInfo.name, adminInfo.identifier),
                inline = true
            },
            {
                name = "⚡ Action",
                value = action,
                inline = true
            }
        },
        footer = {
            text = "Admin Command Executed"
        }
    }
    
    if targetInfo then
        table.insert(embed.fields, {
            name = "🎯 Target",
            value = string.format("**%s**\n`%s`", targetInfo.name, targetInfo.identifier),
            inline = true
        })
    end
    
    if details then
        table.insert(embed.fields, {
            name = "📝 Details",
            value = details,
            inline = false
        })
    end
    
    sendWebhook('admin', embed)
end

-- Performance Alert Logging
function LogPerformanceAlert(operation, duration, threshold, context)
    local embed = {
        title = "⚡ Performance Alert",
        color = COLORS.WARNING,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "🔧 Operation",
                value = operation,
                inline = true
            },
            {
                name = "⏱️ Duration",
                value = string.format("%dms", duration),
                inline = true
            },
            {
                name = "🎯 Threshold",
                value = string.format("%dms", threshold),
                inline = true
            },
            {
                name = "📊 Performance Impact",
                value = string.format("%.1f%% over threshold", ((duration / threshold) - 1) * 100),
                inline = true
            }
        },
        footer = {
            text = "Performance monitoring alert"
        }
    }
    
    if context then
        table.insert(embed.fields, {
            name = "📝 Context",
            value = json.encode(context),
            inline = false
        })
    end
    
    sendWebhook('performance', embed)
end

-- Shop Opening/Closing Logging
function LogShopAccess(source, shopData, action)
    local playerInfo = getPlayerInfo(source)
    
    local embed = {
        title = action == "open" and "🏪 Shop Opened" or "🚪 Shop Closed",
        color = COLORS.INFO,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "👤 Player",
                value = string.format("**%s**\n`%s`", playerInfo.name, playerInfo.identifier),
                inline = true
            },
            {
                name = "🏪 Shop",
                value = string.format("**%s**\nLocation: %s", shopData.label or shopData.id, shopData.location or "1"),
                inline = true
            },
            {
                name = "👔 Job",
                value = playerInfo.job,
                inline = true
            }
        },
        footer = {
            text = "Shop Access Log"
        }
    }
    
    sendWebhook('general', embed)
end

-- Robbery Logging
function LogRobbery(source, shopData, progress, reward)
    local playerInfo = getPlayerInfo(source)
    
    local embed = {
        title = "🔫 Shop Robbery",
        color = COLORS.ERROR,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "👤 Robber",
                value = string.format("**%s**\n`%s`", playerInfo.name, playerInfo.identifier),
                inline = true
            },
            {
                name = "🏪 Shop",
                value = string.format("**%s**\nLocation: %s", shopData.label or shopData.id, shopData.location or "1"),
                inline = true
            },
            {
                name = "📊 Progress",
                value = string.format("%.1f%%", (progress or 0) * 100),
                inline = true
            },
            {
                name = "💰 Reward",
                value = formatMoney(reward or 0),
                inline = true
            },
            {
                name = "👔 Job",
                value = playerInfo.job,
                inline = true
            },
            {
                name = "🚨 Status",
                value = "Police may have been notified",
                inline = true
            }
        },
        footer = {
            text = "Security Alert - Robbery in Progress"
        }
    }
    
    sendWebhook('security', embed)
end

-- Server Events Logging
function LogServerEvent(eventType, message, data)
    local embed = {
        title = "🖥️ Server Event",
        color = COLORS.INFO,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "📡 Event",
                value = eventType,
                inline = true
            },
            {
                name = "📝 Message",
                value = message,
                inline = false
            }
        },
        footer = {
            text = "Server Status Update"
        }
    }
    
    if data then
        table.insert(embed.fields, {
            name = "📊 Data",
            value = "```json\n" .. json.encode(data, {indent = true}) .. "\n```",
            inline = false
        })
    end
    
    sendWebhook('general', embed)
end

-- Daily Summary (can be called via cron job or timer)
function LogDailySummary()
    -- This would require tracking daily statistics
    local embed = {
        title = "📊 Daily Shop Summary",
        color = COLORS.INFO,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        fields = {
            {
                name = "📅 Date",
                value = os.date("%Y-%m-%d"),
                inline = true
            },
            {
                name = "🛒 Total Purchases",
                value = "Data collection needed", -- Would need to implement tracking
                inline = true
            },
            {
                name = "💰 Total Revenue",
                value = "Data collection needed",
                inline = true
            },
            {
                name = "👥 Active Players",
                value = tostring(#GetPlayers()),
                inline = true
            }
        },
        footer = {
            text = "Daily Statistics Report"
        }
    }
    
    sendWebhook('general', embed)
end

-- Export functions for use in other files
_G.DiscordLogger = {
    LogPurchase = LogPurchase,
    LogSale = LogSale,
    LogSecurityEvent = LogSecurityEvent,
    LogAdminAction = LogAdminAction,
    LogPerformanceAlert = LogPerformanceAlert,
    LogShopAccess = LogShopAccess,
    LogRobbery = LogRobbery,
    LogServerEvent = LogServerEvent,
    LogDailySummary = LogDailySummary
}

logger:info("Discord Logging System initialized successfully")

-- Test webhook on resource start (optional)
if config.debug then
    CreateThread(function()
        Wait(5000) -- Wait 5 seconds after resource start
        LogServerEvent("Resource Started", "Paragon Shops Discord Logging System is now active", {
            version = "1.5.0",
            timestamp = os.date("%Y-%m-%d %H:%M:%S")
        })
    end)
end
