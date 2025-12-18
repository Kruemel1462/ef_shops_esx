import Cart from "./Cart";
import SellCart from "./SellCart";
import ShopGrid from "./ShopGrid";
import { fetchNui } from "../utils/fetchNui";
import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { faCreditCard, faMoneyBill1Wave, faXmark, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatMoney, isEnvBrowser } from "../utils/misc";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function ShopTitle() {
	const { CurrentShop } = useStoreShop();

	if (!CurrentShop)
		return (
			<div className="my-auto ml-6 flex h-full w-1/6 flex-col gap-2">
				<Skeleton className="h-1/4 w-full rounded-full" />
				<Skeleton className="h-1/4 w-2/3 rounded-full" />
				<Skeleton className="h-1/4 w-2/3 rounded-full" />
			</div>
		);

	return (
		<div className="ml-6 flex items-center gap-4">
			<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-500/30">
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/20 to-transparent"></div>
				<span className="relative text-3xl">🏪</span>
			</div>
			<div>
				<div className="text-xs font-semibold uppercase tracking-widest text-orange-400/80">Shop</div>
				<h1 className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-4xl font-black text-transparent drop-shadow-2xl">
					{CurrentShop?.label}
				</h1>
			</div>
		</div>
	);
}

function PlayerData() {
	const { Money } = useStoreSelf();
	const { CurrentShop } = useStoreShop();

	if (!CurrentShop?.canBuy) return null;
	if (!Money) return null;

	return (
		<div className="flex gap-3">
			<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600/20 to-green-800/20 px-5 py-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-green-500/20">
				<div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
				<div className="relative flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
						<FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} className="text-green-400" />
					</div>
					<div>
						<div className="text-xs font-medium text-green-400/70">Cash</div>
						<span className="text-lg font-bold text-green-100">${formatMoney(Money.Cash)}</span>
					</div>
				</div>
			</div>
			<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 px-5 py-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
				<div className="relative flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
						<FontAwesomeIcon size="lg" icon={faCreditCard} className="text-blue-400" />
					</div>
					<div>
						<div className="text-xs font-medium text-blue-400/70">Bank</div>
						<span className="text-lg font-bold text-blue-100">${formatMoney(Money.Bank)}</span>
					</div>
				</div>
			</div>
			{Money.Society > 0 && (
				<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-600/20 to-orange-800/20 px-5 py-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-orange-500/20">
					<div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
					<div className="relative flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
							<FontAwesomeIcon size="lg" icon={faUsers} className="text-orange-400" />
						</div>
						<div>
							<div className="text-xs font-medium text-orange-400/70">Society</div>
							<span className="text-lg font-bold text-orange-100">${formatMoney(Money.Society)}</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function ShopInterface() {
	const { SellingMode, setSellingMode, CurrentShop, clearCart } = useStoreShop();

	// Defensive Programmierung - sichere Standardwerte
	const canBuy = CurrentShop?.canBuy === true;
	const canSell = CurrentShop?.canSell === true;
	const showToggle = CurrentShop && canBuy && canSell;

	// Keyboard Shortcuts für bessere UX (vereinfacht)
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// Nur wenn keine Input-Felder fokussiert sind
			if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

			switch (e.key.toLowerCase()) {
				case "c":
					// C = Clear Cart
					e.preventDefault();
					clearCart();
					break;
				case "t":
					// T = Toggle Selling Mode
					e.preventDefault();
					if (showToggle) {
						if (!SellingMode) {
							fetchNui("getInventory", { shop: CurrentShop?.id });
						}
						setSellingMode(!SellingMode);
					}
					break;
				// ESC entfernt - verursachte Konflikte
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [SellingMode, showToggle, CurrentShop, clearCart, setSellingMode]);
	return (
		<div className="flex size-full flex-col gap-4">
			<div className="flex w-full items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-orange-900/30 to-orange-950/40 p-4 shadow-xl backdrop-blur-sm">
				<ShopTitle />
				<div className="flex items-center gap-3">
					<PlayerData />
					{showToggle && (
						<Button
							className="gpu-accelerated smooth-transition group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-600/30 to-orange-700/30 px-6 py-3 font-semibold text-orange-200 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-orange-500/40 hover:to-orange-600/40 hover:shadow-orange-500/20"
							variant="secondary"
							onClick={() => {
								if (!SellingMode) {
									fetchNui("getInventory", { shop: CurrentShop?.id });
								}
								setSellingMode(!SellingMode);
							}}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<span className="relative">{SellingMode ? "🛒 Kaufen" : "💰 Verkaufen"}</span>
						</Button>
					)}
					{canBuy && CurrentShop?.canRob !== false && (
						<Button
							className="gpu-accelerated smooth-transition group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-700/30 to-red-800/30 px-6 py-3 font-semibold text-red-200 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-red-600/40 hover:to-red-700/40 hover:shadow-red-500/20"
							variant="secondary"
							onClick={() => {
								if (!isEnvBrowser()) fetchNui("startRobbery");
							}}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<span className="relative">🔫 Ausrauben</span>
						</Button>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								variant="ghost"
								className="gpu-accelerated smooth-transition h-12 w-12 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 hover:text-blue-300"
							>
								<span className="text-lg text-blue-400">?</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left" className="max-w-xs">
							<div className="space-y-2">
								<div className="font-semibold text-blue-300">🎮 Keyboard Shortcuts:</div>
								<div className="space-y-1 text-sm">
									<div>
										<span className="font-mono text-blue-400">C</span> = Warenkorb leeren
									</div>
									<div>
										<span className="font-mono text-blue-400">T</span> = Modus wechseln (Kaufen/Verkaufen)
									</div>
									<div>
										<span className="font-mono text-blue-400">ESC</span> = Schließen
									</div>
									<div>
										<span className="font-mono text-blue-400">Doppelklick</span> = 5x kaufen
									</div>
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
					<Button
						size="icon"
						variant="ghost"
						className="gpu-accelerated smooth-transition h-12 w-12 rounded-xl bg-red-600/10 hover:bg-red-600/20 hover:text-red-300"
						onClick={() => {
							if (!isEnvBrowser()) fetchNui("hideFrame");
						}}
					>
						<FontAwesomeIcon icon={faXmark} className="text-xl text-gray-400 transition-colors hover:text-red-400" />
					</Button>
				</div>
			</div>
			<div className="flex h-0 w-full grow items-center gap-4">
				<ShopGrid />
				{SellingMode ? <SellCart /> : <Cart />}
			</div>
		</div>
	);
}
