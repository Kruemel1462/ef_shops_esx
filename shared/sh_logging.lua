-- Advanced Logging System für Paragon Shops
-- Provides structured logging with different levels and contexts

local config = require 'config.config'

---@class Logger
---@field level string Current log level
---@field context string Context for this logger instance
local Logger = {}
Logger.__index = Logger

-- Log levels
local LOG_LEVELS = {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    CRITICAL = 5
}

-- Color codes for console output
local COLORS = {
    DEBUG = "^7",    -- White
    INFO = "^2",     -- Green
    WARN = "^3",     -- Yellow
    ERROR = "^1",    -- Red
    CRITICAL = "^9", -- Dark Red
    RESET = "^7"     -- Reset to white
}

---Create a new logger instance
---@param context string The context/module name for this logger
---@param level? string The minimum log level (default: INFO)
---@return Logger
function Logger.new(context, level)
    local self = setmetatable({}, Logger)
    self.context = context or "Unknown"
    self.level = level or (config.debug and "DEBUG" or "INFO")
    return self
end

---Check if a log level should be output
---@param level string The log level to check
---@return boolean
function Logger:shouldLog(level)
    local currentLevel = LOG_LEVELS[self.level] or LOG_LEVELS.INFO
    local messageLevel = LOG_LEVELS[level] or LOG_LEVELS.INFO
    return messageLevel >= currentLevel
end

---Format a log message
---@param level string Log level
---@param message string The message to log
---@param data? table Additional data to include
---@return string
function Logger:formatMessage(level, message, data)
    local timestamp = os.date("%Y-%m-%d %H:%M:%S")
    local color = COLORS[level] or COLORS.INFO
    local reset = COLORS.RESET
    
    local formatted = string.format("%s[%s] [%s] [%s] %s%s", 
        color, timestamp, level, self.context, message, reset)
    
    if data and type(data) == "table" then
        formatted = formatted .. " | Data: " .. json.encode(data)
    end
    
    return formatted
end

---Log a debug message
---@param message string The message to log
---@param data? table Additional data
function Logger:debug(message, data)
    if self:shouldLog("DEBUG") then
        print(self:formatMessage("DEBUG", message, data))
    end
end

---Log an info message
---@param message string The message to log
---@param data? table Additional data
function Logger:info(message, data)
    if self:shouldLog("INFO") then
        print(self:formatMessage("INFO", message, data))
    end
end

---Log a warning message
---@param message string The message to log
---@param data? table Additional data
function Logger:warn(message, data)
    if self:shouldLog("WARN") then
        print(self:formatMessage("WARN", message, data))
    end
end

---Log an error message
---@param message string The message to log
---@param data? table Additional data
function Logger:error(message, data)
    if self:shouldLog("ERROR") then
        print(self:formatMessage("ERROR", message, data))
    end
end

---Log a critical message
---@param message string The message to log
---@param data? table Additional data
function Logger:critical(message, data)
    if self:shouldLog("CRITICAL") then
        print(self:formatMessage("CRITICAL", message, data))
    end
end

---Log a performance metric
---@param operation string The operation being measured
---@param duration number Duration in milliseconds
---@param data? table Additional context data
function Logger:performance(operation, duration, data)
    local level = duration > 100 and "WARN" or "INFO"
    local message = string.format("Performance: %s took %dms", operation, duration)
    
    if level == "WARN" then
        self:warn(message, data)
    else
        self:info(message, data)
    end
end

---Log a security event
---@param event string The security event type
---@param playerId number Player ID involved
---@param details string Event details
---@param data? table Additional data
function Logger:security(event, playerId, details, data)
    local playerName = GetPlayerName and GetPlayerName(playerId) or "Unknown"
    local message = string.format("Security Event: %s | Player: %s (%d) | %s", 
        event, playerName, playerId, details)
    
    self:warn(message, data)
    
    -- Send to webhook if configured
    if config.logWebhook and config.logWebhook ~= '' then
        self:sendWebhook("Security Alert", message, 15158332) -- Red color
    end
end

---Send a message to Discord webhook
---@param title string Webhook title
---@param description string Webhook description
---@param color? number Embed color (default: blue)
function Logger:sendWebhook(title, description, color)
    if not config.logWebhook or config.logWebhook == '' then return end
    
    local payload = json.encode({
        username = 'Paragon Shops Logger',
        embeds = {{
            title = title,
            description = description,
            color = color or 3447003, -- Blue
            timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
            footer = {
                text = "Paragon Shops v1.5.0"
            }
        }}
    })
    
    PerformHttpRequest(config.logWebhook, function(statusCode, response)
        if statusCode ~= 200 and statusCode ~= 204 then
            self:error("Failed to send webhook", {
                statusCode = statusCode,
                response = response
            })
        end
    end, 'POST', payload, {['Content-Type'] = 'application/json'})
end

-- Export the Logger class
return Logger
