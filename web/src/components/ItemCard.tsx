import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { ShopItem } from "../types/ShopItem";
import { SyntheticEvent } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { faLock, faWeight, faDollarSign, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ItemCard({ item }: { item: ShopItem }) {
        const { addItemToCart, cartValue, cartWeight, CartItems, SellingMode, CurrentShop, addItemToSellCart, SellCartItems } = useStoreShop();
	const { Weight, MaxWeight, Money, Licenses, Job } = useStoreSelf();

        const canNotAfford =
                cartValue + item.price > Money.Cash &&
                cartValue + item.price > Money.Bank &&
                cartValue + item.price > Money.Society;
	const overWeight = Weight + cartWeight + (item.weight || 0) > MaxWeight;
	const currentItemQuantityInCart = CartItems.reduce((total, cartItem) => {
		return cartItem.id === item.id ? total + cartItem.quantity : total;
	}, 0);
	const inStock = item.count === undefined || item.count > currentItemQuantityInCart;
	const hasLicense = (!item.license && true) || (Licenses && Licenses[item.license]) === true;
	const hasCorrectGrade = !item.jobs || (item.jobs && item.jobs[Job.name] && item.jobs[Job.name] <= Job.grade);

        const disabled = canNotAfford || overWeight || !inStock || !hasLicense || !hasCorrectGrade;

        // Helper function to get disabled reason icon
        const getDisabledIcon = () => {
                if (!hasLicense) return faLock;
                if (canNotAfford) return faDollarSign;
                if (overWeight) return faWeight;
                if (!inStock) return faExclamationTriangle;
                if (!hasCorrectGrade) return faLock;
                return faExclamationTriangle;
        };

        if (SellingMode) {
                const currentItemQuantityInSellCart = SellCartItems.reduce((total, cartItem) => {
                        return cartItem.id === item.id ? total + cartItem.quantity : total;
                }, 0);
                const maxCanSell = (item.count || 0) - currentItemQuantityInSellCart;
                const canSell = maxCanSell > 0;

                return (
                        <div
                                className={`group relative flex h-full min-h-44 cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-card/60 to-card/40 p-3 backdrop-blur-sm border border-border/50 transition-all duration-300 ease-out ${
                                        canSell 
                                                ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:from-card/70 hover:to-card/50' 
                                                : 'opacity-50 cursor-not-allowed grayscale'
                                }`}
                                onClick={() => {
                                        if (!canSell) return;
                                        addItemToSellCart(item, 1);
                                }}
                        >
                                {/* Price and Stock Header */}
                                <div className="flex w-full items-start justify-between gap-2">
                                        <div className="flex flex-col items-end">
                                                <div className="rounded-lg bg-green-500/20 px-3 py-1 backdrop-blur-sm">
                                                        <p className="text-lg font-bold text-green-400">{'$'}{item.price}</p>
                                                </div>
                                                {typeof item.basePrice === 'number' && item.basePrice > 0 && item.basePrice !== item.price && (
                                                        <div className={`mt-1 rounded-md px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${
                                                                item.price > item.basePrice 
                                                                        ? 'bg-red-500/20 text-red-400' 
                                                                        : 'bg-green-500/20 text-green-400'
                                                        }`}>
                                                                {item.price > item.basePrice ? '▲' : '▼'} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
                                                        </div>
                                                )}
                                        </div>
                                        <div className="rounded-lg bg-primary/20 px-3 py-1 backdrop-blur-sm">
                                                <p className="text-lg font-bold text-primary">{item.count}x</p>
                                        </div>
                                </div>

                                {/* Item Image */}
                                <div className="flex h-[60%] items-center justify-center p-2">
                                        <img
                                                onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
                                                        event.currentTarget.src = "./Box.png";
                                                }}
                                                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                src={item.imagePath}
                                                alt={item.label}
                                        />
                                </div>

                                {/* Item Label */}
                                <div className="rounded-lg bg-background/50 px-3 py-2 backdrop-blur-sm">
                                        <p className="text-center text-sm font-semibold truncate">{item.label}</p>
                                </div>
                        </div>
                );
        }

        return (
                <Tooltip>
			<TooltipPortal>
				{disabled && (
					<TooltipContent className="max-w-xs">
                                                <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={getDisabledIcon()} className="text-destructive" />
                                                        <span>
                                                                {(!hasLicense && "Du brauchst eine " + item.license + " Lizenz um das Item zu kaufen.") ||
                                                                        (canNotAfford && "Du kannst dir das Item nicht leisten.") ||
                                                                        (overWeight && "Du kannst das Item nicht tragen.") ||
                                                                        (!inStock && "Dieser Artikel ist ausverkauft") ||
                                                                        (!hasCorrectGrade && "Du hast nicht den richtigen Job oder Rang, um dieses Item zu kaufen.")}
                                                        </span>
                                                </div>
					</TooltipContent>
				)}
			</TooltipPortal>
			<TooltipTrigger asChild>
				<div
					className={`group relative flex h-full min-h-44 cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-card/60 to-card/40 p-3 backdrop-blur-sm border border-border/50 transition-all duration-300 ease-out ${
                                                disabled
                                                        ? 'cursor-not-allowed opacity-60 grayscale hover:grayscale'
                                                        : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:from-card/70 hover:to-card/50'
                                        }`}
					onClick={() => {
						if (disabled) return;
						addItemToCart(item);
					}}
				>
                                        {/* Disabled Overlay */}
                                        {disabled && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/20 backdrop-blur-[1px]">
                                                        <div className="rounded-full bg-destructive/20 p-3 backdrop-blur-sm">
                                                                <FontAwesomeIcon icon={getDisabledIcon()} className="text-destructive text-xl" />
                                                        </div>
                                                </div>
                                        )}

                                        {/* Price and Stock Header */}
                                        <div className="flex w-full items-start justify-between gap-2">
                                                <div className="flex flex-col items-end">
                                                        <div className={`rounded-lg px-3 py-1 backdrop-blur-sm ${
                                                                item.price === 0 
                                                                        ? 'bg-green-500/20 text-green-400' 
                                                                        : 'bg-primary/20 text-primary'
                                                        }`}>
                                                                <p className="text-lg font-bold">{item.price === 0 ? "GRATIS" : "$" + item.price}</p>
                                                        </div>
                                                        {typeof item.basePrice === 'number' && item.basePrice > 0 && item.basePrice !== item.price && (
                                                                <div className={`mt-1 rounded-md px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${
                                                                        item.price > item.basePrice 
                                                                                ? 'bg-red-500/20 text-red-400' 
                                                                                : 'bg-green-500/20 text-green-400'
                                                                }`}>
                                                                        {item.price > item.basePrice ? '▲' : '▼'} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
                                                                </div>
                                                        )}
                                                </div>
                                                {item.count !== undefined && (
                                                        <div className="rounded-lg bg-secondary/60 px-3 py-1 backdrop-blur-sm">
                                                                <p className="text-lg font-bold text-secondary-foreground">{item.count}x</p>
                                                        </div>
                                                )}
                                        </div>

                                        {/* Item Image */}
                                        <div className="flex h-[60%] items-center justify-center p-2">
                                                <img
                                                        onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
                                                                event.currentTarget.src = "./Box.png";
                                                        }}
                                                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                        src={item.imagePath}
                                                        alt={item.label}
                                                />
                                        </div>

                                        {/* Item Label */}
                                        <div className="rounded-lg bg-background/50 px-3 py-2 backdrop-blur-sm">
                                                <p className="text-center text-sm font-semibold truncate">{item.label}</p>
                                        </div>
				</div>
			</TooltipTrigger>
		</Tooltip>
	);
}
