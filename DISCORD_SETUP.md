# Discord Logging Setup Guide

Dieses Dokument erklärt, wie du das umfassende Discord Logging System für Paragon Shops einrichtest.

## 🎯 **Übersicht**

Das Discord Logging System protokolliert automatisch alle wichtigen Shop-Aktivitäten in verschiedene Discord-Kanäle:

- **🛒 Purchases** - Alle Käufe mit Details
- **💰 Sales** - Verkäufe von Items
- **🚨 Security** - Sicherheitsereignisse und verdächtige Aktivitäten
- **👮‍♂️ Admin** - Admin-Befehle und -Aktionen
- **⚡ Performance** - Performance-Warnungen
- **📊 General** - Allgemeine Events und Shop-Zugriffe

## 📋 **Schritt 1: Discord Webhooks erstellen**

### 1.1 Discord Server vorbereiten
1. Erstelle separate Kanäle für verschiedene Log-Typen:
   ```
   #shop-purchases
   #shop-sales
   #shop-security
   #shop-admin
   #shop-performance
   #shop-general
   ```

### 1.2 Webhooks erstellen
Für jeden Kanal:

1. **Rechtsklick auf den Kanal** → `Kanal bearbeiten`
2. **Integrationen** → `Webhooks`
3. **Webhook erstellen**
4. **Name vergeben** (z.B. "Shop Purchases Logger")
5. **Avatar hochladen** (optional)
6. **Webhook-URL kopieren** ⚠️ **WICHTIG: URL sicher aufbewahren!**

## 🔧 **Schritt 2: Konfiguration**

### 2.1 config.lua bearbeiten
Öffne `config/config.lua` und füge deine Webhook-URLs ein:

```lua
-- Discord Logging Konfiguration
discord = {
    enabled = true, -- Discord Logging aktivieren/deaktivieren
    webhooks = {
        purchases = 'https://discord.com/api/webhooks/DEINE_PURCHASE_WEBHOOK_URL',
        sales = 'https://discord.com/api/webhooks/DEINE_SALES_WEBHOOK_URL',
        security = 'https://discord.com/api/webhooks/DEINE_SECURITY_WEBHOOK_URL',
        admin = 'https://discord.com/api/webhooks/DEINE_ADMIN_WEBHOOK_URL',
        performance = 'https://discord.com/api/webhooks/DEINE_PERFORMANCE_WEBHOOK_URL',
        general = 'https://discord.com/api/webhooks/DEINE_GENERAL_WEBHOOK_URL'
    }
},
```

### 2.2 Fallback Webhook (Optional)
Du kannst auch nur eine Webhook-URL für alle Events verwenden:

```lua
logWebhook = 'https://discord.com/api/webhooks/DEINE_FALLBACK_WEBHOOK_URL',
```

## 📊 **Schritt 3: Logging-Features**

### 3.1 Automatische Events
Das System loggt automatisch:

#### 🛒 **Purchase Events**
- Spieler-Informationen
- Gekaufte Items mit Mengen
- Bezahlmethode (Cash/Bank/Society)
- Shop-Location
- Spieler-Balance nach Kauf

#### 💰 **Sale Events**
- Verkaufte Items
- Erhaltener Betrag
- Spieler-Balance nach Verkauf

#### 🚨 **Security Events**
- Rate Limit Überschreitungen
- Verdächtige Kaufversuche
- Ungültige Daten
- Exploit-Versuche

#### 👮‍♂️ **Admin Events**
- Ausgeführte Admin-Befehle
- Performance-Reports
- Debug-Aktionen
- System-Änderungen

#### ⚡ **Performance Events**
- Langsame Datenbankabfragen
- Performance-Schwellenwert-Überschreitungen
- System-Health-Warnungen

#### 📊 **General Events**
- Shop-Öffnungen/Schließungen
- Resource-Start/Stop
- System-Status-Updates

### 3.2 Manuelle Logging-Funktionen
Du kannst auch manuell Events loggen:

```lua
-- Beispiel: Security Event loggen
if DiscordLogger then
    DiscordLogger.LogSecurityEvent(source, "Suspicious Activity", "Player tried to exploit shop", "critical")
end

-- Beispiel: Admin Action loggen
if DiscordLogger then
    DiscordLogger.LogAdminAction(source, "Player Kick", targetId, "Kicked for exploiting")
end
```

## 🎨 **Schritt 4: Anpassung**

### 4.1 Embed-Farben anpassen
In `server/sv_discord_logging.lua`:

```lua
local COLORS = {
    SUCCESS = 3066993,    -- Grün
    WARNING = 15105570,   -- Orange
    ERROR = 15158332,     -- Rot
    INFO = 3447003,       -- Blau
    SECURITY = 10181046,  -- Lila
    MONEY = 15844367,     -- Gold
    ADMIN = 2123412       -- Dunkelblau
}
```

### 4.2 Webhook-Avatar anpassen
```lua
avatar_url = 'https://deine-domain.com/shop-icon.png'
```

### 4.3 Logging deaktivieren
```lua
discord = {
    enabled = false, -- Komplett deaktivieren
    -- oder einzelne Webhooks leer lassen:
    webhooks = {
        purchases = '', -- Deaktiviert Purchase-Logging
        sales = 'https://...',
        -- ...
    }
}
```

## 🔒 **Schritt 5: Sicherheit**

### 5.1 Webhook-URLs schützen
- ⚠️ **NIE** Webhook-URLs öffentlich teilen
- Verwende Umgebungsvariablen für sensible URLs
- Regelmäßig Webhooks erneuern

### 5.2 Berechtigungen
- Nur Admins sollten Zugriff auf Log-Kanäle haben
- Verwende Discord-Rollen für Zugriffskontrolle

### 5.3 Rate Limiting
Discord hat Rate Limits für Webhooks:
- **30 Requests pro Minute** pro Webhook
- Bei Überschreitung werden Logs verzögert

## 📈 **Schritt 6: Monitoring**

### 6.1 Log-Qualität überwachen
- Prüfe regelmäßig, ob alle Events ankommen
- Achte auf Fehler in der Server-Console
- Teste verschiedene Szenarien

### 6.2 Performance überwachen
```bash
# Admin-Befehle zum Monitoring
/shops:performance  # Performance-Report
/shops:stats       # Shop-Statistiken
```

### 6.3 Webhook-Status prüfen
Bei Problemen:
1. Webhook-URL überprüfen
2. Discord-Kanal-Berechtigungen prüfen
3. Server-Console auf Fehler überprüfen

## 🛠️ **Troubleshooting**

### Problem: Keine Logs in Discord
**Lösung:**
1. Webhook-URL korrekt kopiert?
2. `discord.enabled = true` gesetzt?
3. Server-Console auf HTTP-Fehler prüfen

### Problem: Nur manche Events werden geloggt
**Lösung:**
1. Einzelne Webhook-URLs überprüfen
2. Fallback-Webhook konfigurieren
3. Discord-Kanal-Berechtigungen prüfen

### Problem: Logs kommen verzögert an
**Lösung:**
1. Discord Rate Limits beachten
2. Weniger Events loggen
3. Mehrere Webhooks verwenden

## 📋 **Beispiel-Konfiguration**

```lua
-- Vollständige Discord-Konfiguration
discord = {
    enabled = true,
    webhooks = {
        purchases = 'https://discord.com/api/webhooks/123456789/abcdefghijklmnop',
        sales = 'https://discord.com/api/webhooks/123456789/qrstuvwxyz123456',
        security = 'https://discord.com/api/webhooks/123456789/security_webhook_url',
        admin = 'https://discord.com/api/webhooks/123456789/admin_webhook_url',
        performance = 'https://discord.com/api/webhooks/123456789/perf_webhook_url',
        general = 'https://discord.com/api/webhooks/123456789/general_webhook_url'
    }
},
```

## 🎉 **Fertig!**

Nach der Konfiguration erhältst du automatisch detaillierte Logs für alle Shop-Aktivitäten in Discord. Das System hilft dir dabei:

- **Betrug zu erkennen** durch Security-Logs
- **Performance-Probleme** frühzeitig zu identifizieren
- **Admin-Aktionen** nachzuvollziehen
- **Shop-Aktivitäten** zu überwachen

Bei Fragen oder Problemen erstelle ein Issue im GitHub-Repository!

---

**Entwickelt von**: VentumVSYSTEM  
**Version**: 1.5.0  
**Datum**: 08.01.2025
