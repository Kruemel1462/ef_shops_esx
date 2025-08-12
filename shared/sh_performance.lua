-- Performance Monitoring System für Paragon Shops
-- Tracks performance metrics and provides optimization insights

local Logger = require 'shared.sh_logging'
local config = require 'config.config'

---@class PerformanceMonitor
---@field logger Logger Logger instance for this monitor
---@field metrics table<string, table> Performance metrics storage
---@field thresholds table Performance thresholds
local PerformanceMonitor = {}
PerformanceMonitor.__index = PerformanceMonitor

-- Default performance thresholds (in milliseconds)
local DEFAULT_THRESHOLDS = {
    database_query = 50,
    shop_open = 100,
    purchase_transaction = 200,
    inventory_check = 30,
    license_check = 25,
    cache_operation = 5
}

---Create a new performance monitor
---@param context string Context for this monitor
---@return PerformanceMonitor
function PerformanceMonitor.new(context)
    local self = setmetatable({}, PerformanceMonitor)
    self.logger = Logger.new("Performance-" .. context)
    self.metrics = {}
    self.thresholds = config.performance and config.performance.thresholds or DEFAULT_THRESHOLDS
    return self
end

---Start timing an operation
---@param operation string Operation name
---@return number Start time
function PerformanceMonitor:startTimer(operation)
    local startTime = GetGameTimer()
    
    if not self.metrics[operation] then
        self.metrics[operation] = {
            count = 0,
            totalTime = 0,
            minTime = math.huge,
            maxTime = 0,
            avgTime = 0,
            slowOperations = 0
        }
    end
    
    return startTime
end

---End timing an operation and log if necessary
---@param operation string Operation name
---@param startTime number Start time from startTimer
---@param context? table Additional context data
function PerformanceMonitor:endTimer(operation, startTime, context)
    local endTime = GetGameTimer()
    local duration = endTime - startTime
    
    local metric = self.metrics[operation]
    if not metric then
        self.logger:error("Attempted to end timer for unknown operation: " .. operation)
        return
    end
    
    -- Update metrics
    metric.count = metric.count + 1
    metric.totalTime = metric.totalTime + duration
    metric.minTime = math.min(metric.minTime, duration)
    metric.maxTime = math.max(metric.maxTime, duration)
    metric.avgTime = metric.totalTime / metric.count
    
    -- Check if operation was slow
    local threshold = self.thresholds[operation] or 100
    if duration > threshold then
        metric.slowOperations = metric.slowOperations + 1
        self.logger:warn(string.format("Slow operation detected: %s took %dms (threshold: %dms)", 
            operation, duration, threshold), context)
    end
    
    -- Log performance for debugging
    if config.debug then
        self.logger:debug(string.format("Operation %s completed in %dms", operation, duration), context)
    end
    
    return duration
end

---Get performance statistics for an operation
---@param operation string Operation name
---@return table|nil Performance statistics
function PerformanceMonitor:getStats(operation)
    return self.metrics[operation]
end

---Get all performance statistics
---@return table All performance statistics
function PerformanceMonitor:getAllStats()
    return self.metrics
end

---Generate a performance report
---@return string Performance report
function PerformanceMonitor:generateReport()
    local report = {"=== Performance Report ==="}
    
    for operation, metric in pairs(self.metrics) do
        local slowPercentage = (metric.slowOperations / metric.count) * 100
        table.insert(report, string.format(
            "%s: Count=%d, Avg=%.1fms, Min=%.1fms, Max=%.1fms, Slow=%.1f%%",
            operation, metric.count, metric.avgTime, metric.minTime, metric.maxTime, slowPercentage
        ))
    end
    
    return table.concat(report, "\n")
end

---Reset all metrics
function PerformanceMonitor:reset()
    self.metrics = {}
    self.logger:info("Performance metrics reset")
end

---Check if system performance is healthy
---@return boolean, string Health status and message
function PerformanceMonitor:checkHealth()
    local issues = {}
    
    for operation, metric in pairs(self.metrics) do
        local slowPercentage = (metric.slowOperations / metric.count) * 100
        
        -- Check if more than 10% of operations are slow
        if slowPercentage > 10 then
            table.insert(issues, string.format("%s has %.1f%% slow operations", operation, slowPercentage))
        end
        
        -- Check if average time is concerning
        local threshold = self.thresholds[operation] or 100
        if metric.avgTime > threshold * 0.8 then
            table.insert(issues, string.format("%s average time (%.1fms) approaching threshold (%dms)", 
                operation, metric.avgTime, threshold))
        end
    end
    
    if #issues > 0 then
        return false, "Performance issues detected: " .. table.concat(issues, "; ")
    else
        return true, "System performance is healthy"
    end
end

-- Helper function to wrap database operations with performance monitoring
---@param monitor PerformanceMonitor Performance monitor instance
---@param operation string Operation name
---@param func function Function to execute
---@param ... any Function arguments
---@return any Function result
function PerformanceMonitor.wrapDatabaseOperation(monitor, operation, func, ...)
    local startTime = monitor:startTimer("database_" .. operation)
    local success, result = pcall(func, ...)
    monitor:endTimer("database_" .. operation, startTime, {
        success = success,
        operation = operation
    })
    
    if not success then
        monitor.logger:error("Database operation failed: " .. operation, {
            error = result
        })
        return nil
    end
    
    return result
end

-- Helper function to wrap callback operations with performance monitoring
---@param monitor PerformanceMonitor Performance monitor instance
---@param operation string Operation name
---@param func function Function to execute
---@param ... any Function arguments
---@return any Function result
function PerformanceMonitor.wrapCallback(monitor, operation, func, ...)
    local startTime = monitor:startTimer("callback_" .. operation)
    local result = func(...)
    monitor:endTimer("callback_" .. operation, startTime, {
        operation = operation
    })
    
    return result
end

-- Export the PerformanceMonitor class
return PerformanceMonitor
