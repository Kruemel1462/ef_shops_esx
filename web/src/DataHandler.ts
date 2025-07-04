import { useNuiEvent } from "./hooks/useNuiEvent";
import { useStoreSelf } from "./stores/PlayerDataStore";
import { useStoreShop } from "./stores/ShopStore";
import { ShopItem } from "./types/ShopItem";

function DataHander() {
        const { setShopItems, setCurrentShop, clearCart, setInventoryItems } = useStoreShop();
	const { setSelfData } = useStoreSelf();

	useNuiEvent("setSelfData", setSelfData);
	useNuiEvent("setCurrentShop", setCurrentShop);
        useNuiEvent("setShopItems", (items: ShopItem[]) => {
                if (items) setShopItems(items);
                clearCart();
        });
        useNuiEvent("setInventoryItems", (items: ShopItem[]) => {
                if (items) setInventoryItems(items);
        });
}

export default DataHander;
