import { useNuiEvent } from "./hooks/useNuiEvent";
import { useStoreSelf } from "./stores/PlayerDataStore";
import { useStoreShop } from "./stores/ShopStore";
import { ShopItem, Shop } from "./types/ShopItem";
import { fetchNui } from "./utils/fetchNui";

function DataHander() {
        const { setShopItems, setCurrentShop, clearCart, setInventoryItems } = useStoreShop();
	const { setSelfData } = useStoreSelf();

	useNuiEvent("setSelfData", setSelfData);
	useNuiEvent("setCurrentShop", (shop: Shop | null) => {
            setCurrentShop(shop);
            
            // Wenn es sich um einen reinen Verkaufs-Shop handelt, lade automatisch das Inventar
            if (shop && !shop.canBuy && shop.canSell) {
                fetchNui("getInventory", { shop: shop.id });
            }
        });
        useNuiEvent("setShopItems", (items: ShopItem[]) => {
                if (items) setShopItems(items);
                clearCart();
        });
        useNuiEvent("setInventoryItems", (items: ShopItem[]) => {
                if (items) setInventoryItems(items);
        });
}

export default DataHander;
