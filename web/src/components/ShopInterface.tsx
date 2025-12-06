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
		<div className="ml-6 flex items-center gap-3">
			<div className="h-12 w-1 rounded-full bg-gradient-to-b from-orange-500 to-orange-700"></div>
			<h1 className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-4xl font-bold text-transparent drop-shadow-lg">
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
		<div className="flex gap-3">
			<div className="flex items-center gap-2 rounded-lg bg-green-700/30 px-4 py-2 text-lg font-bold leading-none text-green-300 backdrop-blur-sm transition-all duration-200 hover:bg-green-700/40">
				<FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} className="text-green-400" />
				<span className="text-green-100">${formatMoney(Money.Cash)}</span>
			</div>
			<div className="flex items-center gap-2 rounded-lg bg-blue-600/30 px-4 py-2 text-lg font-bold leading-none text-blue-300 backdrop-blur-sm transition-all duration-200 hover:bg-blue-600/40">
				<FontAwesomeIcon size="lg" icon={faCreditCard} className="text-blue-400" />
				<span className="text-blue-100">${formatMoney(Money.Bank)}</span>
			</div>
			{Money.Society > 0 && (
				<div className="flex items-center gap-2 rounded-lg bg-orange-600/30 px-4 py-2 text-lg font-bold leading-none text-orange-300 backdrop-blur-sm transition-all duration-200 hover:bg-orange-600/40">
					<FontAwesomeIcon size="lg" icon={faUsers} className="text-orange-400" />
					<span className="text-orange-100">${formatMoney(Money.Society)}</span>
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
		<div className="flex size-full flex-col gap-1">
			<div className="flex w-full items-center justify-between gap-2">
				<ShopTitle />
				<div className="flex items-center gap-2">
					<PlayerData />
					{showToggle && (
						<Button
							className="gpu-accelerated smooth-transition bg-orange-700/30 text-orange-200 backdrop-blur-sm hover:bg-orange-600/40"
							variant="secondary"
							onClick={() => {
								if (!SellingMode) {
									fetchNui("getInventory", { shop: CurrentShop?.id });
								}
								setSellingMode(!SellingMode);
							}}
						>
							{SellingMode ? "🛒 Kaufen" : "💰 Verkaufen"}
						</Button>
					)}
					{canBuy && CurrentShop?.canRob !== false && (
						<Button
							className="gpu-accelerated smooth-transition bg-red-700/30 text-red-200 backdrop-blur-sm hover:bg-red-600/40"
							variant="secondary"
							onClick={() => {
								if (!isEnvBrowser()) fetchNui("startRobbery");
							}}
						>
							🔫 Ausrauben
						</Button>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								variant="ghost"
								className="gpu-accelerated smooth-transition mr-2 rounded-full hover:bg-blue-500/20 hover:text-blue-300"
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
						className="gpu-accelerated smooth-transition rounded-full hover:bg-red-500/20 hover:text-red-300"
						onClick={() => {
							if (!isEnvBrowser()) fetchNui("hideFrame");
						}}
					>
						<FontAwesomeIcon icon={faXmark} className="p-2 text-gray-400 transition-colors hover:text-red-400" size="xl" />
					</Button>
				</div>
			</div>
			<div className="flex h-0 w-full grow items-center gap-2">
				<ShopGrid />
				{SellingMode ? <SellCart /> : <Cart />}
			</div>
		</div>
	);
}
