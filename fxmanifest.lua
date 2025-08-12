fx_version 'cerulean'
game 'gta5'
use_experimental_fxv2_oal 'yes'

name 'Everfall Shops Enhanced'
author 'Jellyton - Enhanced by VentumVSYSTEM'
version '1.5.0'
description 'Enhanced Everfall shops system with performance optimizations, security improvements, and better error handling. Made with React.'
license 'GPL-3.0'
repository 'https://github.com/VentumVSYSTEM/ef_shops_esx'

lua54 'yes'

ui_page 'web/build/index.html'
--ui_page 'http://localhost:5173/'

shared_scripts {
	'@ox_lib/init.lua',
	'shared/**/*.lua'
}

client_scripts {
	'client/**/*.lua'
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'server/sv_main.lua',
	'server/sv_admin.lua',
	'server/sv_discord_logging.lua'
}

files {
	'config/**/*.lua',
	'web/build/index.html',
	'web/build/**/*',
}

dependencies {
        'ox_lib',
}
