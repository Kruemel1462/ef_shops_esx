import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { ShopItem } from "../types/ShopItem";
import { SyntheticEvent } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";

export default function ItemCard({ item }: { item: ShopItem }) {
	const { addItemToCart, cartValue, cartWeight, CartItems, SellingMode, CurrentShop, addItemToSellCart, SellCartItems } = useStoreShop();
	const { Weight, MaxWeight, Money, Licenses, Job } = useStoreSelf();

	const canNotAfford = cartValue + item.price > Money.Cash && cartValue + item.price > Money.Bank && cartValue + item.price > Money.Society;
	const overWeight = Weight + cartWeight + (item.weight || 0) > MaxWeight;
	const currentItemQuantityInCart = CartItems.reduce((total, cartItem) => {
		return cartItem.id === item.id ? total + cartItem.quantity : total;
	}, 0);
	const inStock = item.count === undefined || item.count > currentItemQuantityInCart;
	const hasLicense = (!item.license && true) || (Licenses && Licenses[item.license]) === true;
	const hasCorrectGrade = !item.jobs || (item.jobs && item.jobs[Job.name] && item.jobs[Job.name] <= Job.grade);

	const disabled = canNotAfford || overWeight || !inStock || !hasLicense || !hasCorrectGrade;

	if (SellingMode) {
		const currentItemQuantityInSellCart = SellCartItems.reduce((total, cartItem) => {
			return cartItem.id === item.id ? total + cartItem.quantity : total;
		}, 0);
		const maxCanSell = (item.count || 0) - currentItemQuantityInSellCart;
		const canSell = maxCanSell > 0;

		return (
			<div
				className={`group flex h-full min-h-[140px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-zinc-900/80 backdrop-blur-sm transition-all duration-200 ${!canSell ? "cursor-not-allowed opacity-40 grayscale" : "border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900"}`}
				onClick={() => {
					if (!canSell) return;
					addItemToSellCart(item, 1);
				}}
			>
				<div className="relative flex flex-1 items-center justify-center border-b border-zinc-800 bg-zinc-950/50 p-3">
					<img
						onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
							event.currentTarget.src = "./Box.png";
						}}
						className="h-full w-full max-h-20 object-contain transition-transform duration-200 group-hover:scale-105"
						src={item.imagePath}
						alt={item.label}
					/>
				</div>
				<div className="flex flex-col gap-1.5 p-2.5">
					<div className="text-xs font-medium text-white line-clamp-2">{item.label}</div>
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold text-emerald-400">${item.price}</span>
						<span className="text-xs font-medium text-orange-400">{item.count}x</span>
					</div>
					{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
						<div className={`text-xs font-medium ${item.price > item.basePrice ? "text-red-400" : "text-green-400"}`}>
							{item.price > item.basePrice ? "↑" : "↓"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<Tooltip>
			<TooltipPortal>
				{disabled && (
					<TooltipContent>
						{(!hasLicense && "Du brauchst eine " + item.license + " Lizenz um das Item zu kaufen.") ||
							(canNotAfford && "Du kannst dir das Item nicht leisten.") ||
							(overWeight && "Du kannst das Item nicht tragen.") ||
							(!inStock && "Dieser Artikel ist ausverkauft") ||
							(!hasCorrectGrade && "Du hast nicht den richtigen Job oder Rang, um dieses Item zu kaufen.")}
					</TooltipContent>
				)}
			</TooltipPortal>
			<TooltipTrigger asChild>
				<div
					className={`group flex h-full min-h-[140px] grow cursor-pointer flex-col overflow-hidden rounded-lg border bg-zinc-900/80 backdrop-blur-sm transition-all duration-200 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[disabled=true]:grayscale hover:data-[disabled=false]:border-orange-500/50 hover:data-[disabled=false]:bg-zinc-900 ${disabled ? "border-zinc-800/50" : "border-zinc-800"}`}
					data-disabled={disabled}
					onClick={() => {
						if (disabled) return;
						addItemToCart(item);
					}}
				>
					<div className="relative flex flex-1 items-center justify-center border-b border-zinc-800 bg-zinc-950/50 p-3">
						<img
							onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
								event.currentTarget.src = "./Box.png";
							}}
							className="h-full w-full max-h-20 object-contain transition-transform duration-200 group-hover:scale-105"
							src={item.imagePath}
							alt={item.label}
						/>
					</div>
					<div className="flex flex-col gap-1.5 p-2.5">
						<div className="text-xs font-medium text-white line-clamp-2">{item.label}</div>
						<div className="flex items-center justify-between">
							<span className={`text-sm font-bold ${item.price == 0 ? "text-emerald-400" : "text-blue-400"}`}>
								{item.price == 0 ? "FREE" : "$" + item.price}
							</span>
							{item.count !== undefined && <span className="text-xs font-medium text-orange-400">{item.count}x</span>}
						</div>
						{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
							<div className={`text-xs font-medium ${item.price > item.basePrice ? "text-red-400" : "text-green-400"}`}>
								{item.price > item.basePrice ? "↑" : "↓"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
							</div>
						)}
					</div>
				</div>
			</TooltipTrigger>
		</Tooltip>
	);
}
