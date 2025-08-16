export type Shop = {
        id: string;
        location: number;
        label: string;
        canBuy: boolean;
        canSell: boolean;
        canRob?: boolean;
};

export type ShopItem = {
	id: number;
	name: string;
	label: string;
	price: number;
	basePrice?: number;
	weight: number;
	count: number;
	imagePath: string;
	type?: string;
	category?: string;
	license?: string;
	jobs?: Record<string, number>;
};

export type CartItem = {
	id: number;
	name: string;
	quantity: number;
};
