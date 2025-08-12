import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { CartItem, Shop, ShopItem } from "../types/ShopItem";

type ShopItems = {
        CurrentShop?: Shop;
        ShopItems?: ShopItem[];
        categorizedItems: Record<string, ShopItem[]>;
        InventoryItems?: ShopItem[];
        inventoryCategorized: Record<string, ShopItem[]>;
        SellingMode: boolean;
        CartItems: CartItem[];
        SellCartItems: CartItem[];
        cartWeight: number;
        cartValue: number;
        sellCartValue: number;
        setCurrentShop: (shop: Shop | null) => void;
        setShopItems: (items: ShopItem[]) => void;
        setInventoryItems: (items: ShopItem[]) => void;
        setSellingMode: (val: boolean) => void;
	addItemToCart: (item: ShopItem, amount?: number) => void;
	removeItemFromCart: (itemId: number, amount?: number, removeAll?: boolean) => void;
	clearCart: () => void;
	addItemToSellCart: (item: ShopItem, amount?: number) => void;
	removeItemFromSellCart: (itemId: number, amount?: number, removeAll?: boolean) => void;
	clearSellCart: () => void;
	getShopItemData: (itemId: number) => ShopItem | undefined;
	getInventoryItemData: (itemId: number) => ShopItem | undefined;
};

export const useStoreShop = create<ShopItems>((set, get) => ({
        // Initial State
        CurrentShop: undefined,
        ShopItems: undefined,
        categorizedItems: {},
        InventoryItems: undefined,
        inventoryCategorized: {},
        SellingMode: false,
        CartItems: [],
        SellCartItems: [],
        cartWeight: 0,
        cartValue: 0,
        sellCartValue: 0,

        setCurrentShop: (shop: Shop | null) => {
                set(() => ({
                        CurrentShop: shop,
                        SellingMode: shop ? (!shop.canBuy && shop.canSell ? true : false) : false,
                }));
        },

        setShopItems: (items: ShopItem[]) => {
                const categorizedItems: Record<string, ShopItem[]> = {};

		items.forEach((item) => {
			const category = item.category || "Misc";
			if (!categorizedItems[category]) {
				categorizedItems[category] = [];
			}
			categorizedItems[category].push(item);
		});

                set(() => ({
                        ShopItems: [...items],
                        categorizedItems,
                }));
        },

        setInventoryItems: (items: ShopItem[]) => {
                const categorized: Record<string, ShopItem[]> = { Inventory: items };
                set(() => ({
                        InventoryItems: [...items],
                        inventoryCategorized: categorized,
                }));
        },

        setSellingMode: (val: boolean) => {
                set(() => ({
                        SellingMode: val,
                }));
                
                // Clear sell cart when switching to buy mode
                if (!val) {
                        set(() => ({
                                SellCartItems: [],
                                sellCartValue: 0,
                        }));
                }
        },

	addItemToCart: (item: ShopItem, amount: number) => {
		const { CartItems, cartWeight, cartValue } = get();
		const existingItemIndex = CartItems.findIndex((cartItem) => cartItem.id === item.id);

		const newCartWeight = cartWeight + (item.weight || 0) * (amount || 1);
		const newCartValue = cartValue + (item.price || 0) * (amount || 1);

		if (existingItemIndex >= 0) {
			// Item already exists in cart, increase quantity and update weight and value
			const updatedCartItems = CartItems.map((cartItem, index) =>
				index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + (amount || 1) } : cartItem,
			);
			set(() => ({
				CartItems: updatedCartItems,
				cartWeight: newCartWeight,
				cartValue: newCartValue,
			}));
		} else {
			// Item not in cart, add new item
			const newItem = { id: item.id, name: item.name, quantity: amount || 1, weight: item.weight, price: item.price };
			set(() => ({
				CartItems: [...CartItems, newItem],
				cartWeight: newCartWeight,
				cartValue: newCartValue,
			}));
		}
	},

	removeItemFromCart: (itemId: number, amount?: number, removeAll: boolean = false) => {
		const { CartItems, cartWeight, cartValue, getShopItemData } = get();
		const existingItemIndex = CartItems.findIndex((cartItem) => cartItem.id === itemId);

		if (existingItemIndex >= 0) {
			const existingItem = CartItems[existingItemIndex];
			const shopItem = getShopItemData(existingItem.id);
			const itemWeightReduction = (shopItem.weight || 0) * (removeAll ? existingItem.quantity : amount || 1);
			const itemValueReduction = (shopItem.price || 0) * (removeAll ? existingItem.quantity : amount || 1);

			if (existingItem.quantity > 1 && !removeAll) {
				// Decrease quantity, update weight and value
				const updatedCartItems = CartItems.map((cartItem, index) =>
					index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity - (amount || 1) } : cartItem,
				);
				set(() => ({
					CartItems: updatedCartItems,
					cartWeight: cartWeight - itemWeightReduction,
					cartValue: cartValue - itemValueReduction,
				}));
			} else {
				// Remove item entirely, update weight and value
				const updatedCartItems = CartItems.filter((_, index) => index !== existingItemIndex);
				set(() => ({
					CartItems: updatedCartItems,
					cartWeight: cartWeight - itemWeightReduction,
					cartValue: cartValue - itemValueReduction,
				}));
			}
		}
	},

	clearCart: () => {
		set(() => ({
			CartItems: [],
			cartWeight: 0,
			cartValue: 0,
		}));
	},

	getShopItemData: (itemId: number) => {
		const { ShopItems } = get();
		if (ShopItems) {
			return ShopItems.find((item) => item.id === itemId);
		}
		return undefined;
	},

	getInventoryItemData: (itemId: number) => {
		const { InventoryItems } = get();
		if (InventoryItems) {
			return InventoryItems.find((item) => item.id === itemId);
		}
		return undefined;
	},

	addItemToSellCart: (item: ShopItem, amount: number = 1) => {
		const { SellCartItems, sellCartValue } = get();
		const existingItemIndex = SellCartItems.findIndex((cartItem) => cartItem.id === item.id);

		const newSellCartValue = sellCartValue + (item.price || 0) * amount;

		if (existingItemIndex >= 0) {
			// Item already exists in sell cart, increase quantity
			const updatedSellCartItems = SellCartItems.map((cartItem, index) =>
				index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + amount } : cartItem,
			);
			set(() => ({
				SellCartItems: updatedSellCartItems,
				sellCartValue: newSellCartValue,
			}));
		} else {
			// Item not in sell cart, add new item
			const newItem = { id: item.id, name: item.name, quantity: amount, weight: item.weight, price: item.price };
			set(() => ({
				SellCartItems: [...SellCartItems, newItem],
				sellCartValue: newSellCartValue,
			}));
		}
	},

	removeItemFromSellCart: (itemId: number, amount: number = 1, removeAll: boolean = false) => {
		const { SellCartItems, sellCartValue, getInventoryItemData } = get();
		const existingItemIndex = SellCartItems.findIndex((cartItem) => cartItem.id === itemId);

		if (existingItemIndex >= 0) {
			const existingItem = SellCartItems[existingItemIndex];
			const inventoryItem = getInventoryItemData(existingItem.id);
			const itemValueReduction = (inventoryItem?.price || 0) * (removeAll ? existingItem.quantity : amount);

			if (existingItem.quantity > 1 && !removeAll) {
				// Decrease quantity
				const updatedSellCartItems = SellCartItems.map((cartItem, index) =>
					index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity - amount } : cartItem,
				);
				set(() => ({
					SellCartItems: updatedSellCartItems,
					sellCartValue: sellCartValue - itemValueReduction,
				}));
			} else {
				// Remove item entirely
				const updatedSellCartItems = SellCartItems.filter((_, index) => index !== existingItemIndex);
				set(() => ({
					SellCartItems: updatedSellCartItems,
					sellCartValue: sellCartValue - itemValueReduction,
				}));
			}
		}
	},

	clearSellCart: () => {
		set(() => ({
			SellCartItems: [],
			sellCartValue: 0,
		}));
	},
}));
