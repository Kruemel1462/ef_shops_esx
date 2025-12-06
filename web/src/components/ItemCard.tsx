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
				className={`gpu-accelerated smooth-transition flex h-full min-h-44 cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-card/60 to-card/40 p-3 backdrop-blur-sm ${!canSell ? "cursor-not-allowed opacity-50 grayscale" : "hover:scale-[1.02]"}`}
				onClick={() => {
					if (!canSell) return;
					addItemToSellCart(item, 1);
				}}
			>
				<div className="mx-auto flex w-full items-center justify-between gap-2">
					<div className="text-right">
						<div className="rounded-md bg-green-600/30 px-2 py-1 backdrop-blur-sm">
							<p className="text-lg font-bold text-green-200">${item.price}</p>
						</div>
						{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
							<p className={`mt-1 text-xs font-semibold ${item.price > item.basePrice ? "text-red-400" : "text-green-400"}`}>
								{item.price > item.basePrice ? "📈" : "📉"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
							</p>
						)}
					</div>
					<div className="rounded-md bg-orange-600/30 px-2 py-1 backdrop-blur-sm">
						<p className="text-lg font-bold text-orange-200">{item.count}x</p>
					</div>
				</div>
				<div className="m-auto flex h-[70%] items-center justify-center rounded-lg bg-background/30">
					<img
						onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
							event.currentTarget.src = "./Box.png";
						}}
						className="h-full w-full object-contain p-2"
						src={item.imagePath}
						alt={item.label}
					/>
				</div>
				<div className="rounded-md bg-background/20 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text px-2 py-1 text-center text-sm font-semibold text-transparent">
					{item.label}
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
					className={`gpu-accelerated smooth-transition flex h-full min-h-44 grow cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-card/60 to-card/40 p-3 backdrop-blur-sm data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-card/10 data-[disabled=true]:grayscale hover:data-[disabled=false]:scale-[1.02]`}
					data-disabled={disabled}
					onClick={() => {
						if (disabled) return;
						addItemToCart(item);
					}}
				>
					<div className="mx-auto flex w-full items-center justify-between gap-2">
						<div className="text-right">
							<div className={`rounded-md px-2 py-1 backdrop-blur-sm ${item.price == 0 ? "bg-emerald-600/30" : "bg-blue-600/30"}`}>
								<p className={`text-lg font-bold ${item.price == 0 ? "text-emerald-200" : "text-blue-200"}`}>
									{item.price == 0 ? "GRATIS" : "$" + item.price}
								</p>
							</div>
							{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
								<p className={`mt-1 text-xs font-semibold ${item.price > item.basePrice ? "text-red-400" : "text-green-400"}`}>
									{item.price > item.basePrice ? "📈" : "📉"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
								</p>
							)}
						</div>
						{item.count !== undefined && (
							<div className="rounded-md bg-orange-600/30 px-2 py-1 backdrop-blur-sm">
								<p className="text-lg font-bold text-orange-200">{item.count}x</p>
							</div>
						)}
					</div>
					<div className="m-auto flex h-[70%] items-center justify-center rounded-lg bg-background/30">
						<img
							onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
								event.currentTarget.src = "./Box.png";
							}}
							className="h-full w-full object-contain p-2"
							src={item.imagePath}
							alt={item.label}
						/>
					</div>
					<div className="rounded-md bg-background/20 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text px-2 py-1 text-center text-sm font-semibold text-transparent">
						{item.label}
					</div>
				</div>
			</TooltipTrigger>
		</Tooltip>
	);
}
