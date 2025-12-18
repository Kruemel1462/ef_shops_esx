import Cart from "./Cart";
import SellCart from "./SellCart";
import ShopGrid from "./ShopGrid";
import { fetchNui } from "../utils/fetchNui";
import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { faCreditCard, faMoneyBill1Wave, faXmark, faUsers, faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatMoney, isEnvBrowser } from "../utils/misc";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useEffect } from "react";

function ShopTitle() {
	const { CurrentShop } = useStoreShop();

	if (!CurrentShop)
		return (
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-4 w-24 rounded" />
				<Skeleton className="h-8 w-48 rounded" />
			</div>
		);

	return (
		<div className="flex flex-col gap-0.5">
			<div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Store</div>
			<h1 className="text-2xl font-bold text-white">
				{CurrentShop?.label}
			</h1>
		</div>
	);
}

function PlayerData() {
	const { Money } = useStoreSelf();
	const { CurrentShop } = useStoreShop();

	if (!CurrentShop?.canBuy) return null;
	if (!Money) return null;

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 backdrop-blur-sm">
				<FontAwesomeIcon icon={faMoneyBill1Wave} className="text-sm text-emerald-500" />
				<span className="text-sm font-semibold text-white">${formatMoney(Money.Cash)}</span>
			</div>
			<div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 backdrop-blur-sm">
				<FontAwesomeIcon icon={faCreditCard} className="text-sm text-blue-500" />
				<span className="text-sm font-semibold text-white">${formatMoney(Money.Bank)}</span>
			</div>
			{Money.Society > 0 && (
				<div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 backdrop-blur-sm">
					<FontAwesomeIcon icon={faUsers} className="text-sm text-orange-500" />
					<span className="text-sm font-semibold text-white">${formatMoney(Money.Society)}</span>
				</div>
			)}
		</div>
	);
}

export default function ShopInterface() {
	const { SellingMode, setSellingMode, CurrentShop, clearCart } = useStoreShop();

	const canBuy = CurrentShop?.canBuy === true;
	const canSell = CurrentShop?.canSell === true;
	const showToggle = CurrentShop && canBuy && canSell;

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

			switch (e.key.toLowerCase()) {
				case "c":
					e.preventDefault();
					clearCart();
					break;
				case "t":
					e.preventDefault();
					if (showToggle) {
						if (!SellingMode) {
							fetchNui("getInventory", { shop: CurrentShop?.id });
						}
						setSellingMode(!SellingMode);
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [SellingMode, showToggle, CurrentShop, clearCart, setSellingMode]);

	return (
		<div className="flex size-full flex-col gap-3">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
				<ShopTitle />
				<div className="flex items-center gap-2">
					<PlayerData />
					{showToggle && (
						<Button
							size="sm"
							variant="ghost"
							className="h-9 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-700 hover:bg-orange-950/30 hover:text-orange-400"
							onClick={() => {
								if (!SellingMode) {
									fetchNui("getInventory", { shop: CurrentShop?.id });
								}
								setSellingMode(!SellingMode);
							}}
						>
							<FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-xs" />
							{SellingMode ? "Buy" : "Sell"}
						</Button>
					)}
					{canBuy && CurrentShop?.canRob !== false && (
						<Button
							size="sm"
							variant="ghost"
							className="h-9 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-red-700 hover:bg-red-950/30 hover:text-red-400"
							onClick={() => {
								if (!isEnvBrowser()) fetchNui("startRobbery");
							}}
						>
							Rob
						</Button>
					)}
					<Button
						size="icon"
						variant="ghost"
						className="h-9 w-9 rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-white"
						onClick={() => {
							if (!isEnvBrowser()) fetchNui("hideFrame");
						}}
					>
						<FontAwesomeIcon icon={faXmark} className="text-base" />
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex h-0 w-full grow gap-3">
				<ShopGrid />
				{SellingMode ? <SellCart /> : <Cart />}
			</div>
		</div>
	);
}
