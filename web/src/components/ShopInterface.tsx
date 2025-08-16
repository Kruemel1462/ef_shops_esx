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
			<div className="h-12 w-1 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></div>
			<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
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
                        <div className="flex items-center gap-2 rounded-lg bg-green-700/30 backdrop-blur-sm px-4 py-2 text-lg font-bold leading-none text-green-300 hover:bg-green-700/40 transition-all duration-200">
                                <FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} className="text-green-400" />
                                <span className="text-green-100">${formatMoney(Money.Cash)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-blue-600/30 backdrop-blur-sm px-4 py-2 text-lg font-bold leading-none text-blue-300 hover:bg-blue-600/40 transition-all duration-200">
                                <FontAwesomeIcon size="lg" icon={faCreditCard} className="text-blue-400" />
                                <span className="text-blue-100">${formatMoney(Money.Bank)}</span>
                        </div>
                        {Money.Society > 0 && (
                                <div className="flex items-center gap-2 rounded-lg bg-orange-600/30 backdrop-blur-sm px-4 py-2 text-lg font-bold leading-none text-orange-300 hover:bg-orange-600/40 transition-all duration-200">
                                        <FontAwesomeIcon size="lg" icon={faUsers} className="text-orange-400" />
                                        <span className="text-orange-100">${formatMoney(Money.Society)}</span>
                                </div>
                        )}
                </div>
        );
}

export default function ShopInterface() {
        const { SellingMode, setSellingMode, CurrentShop } = useStoreShop();
        
        // Defensive Programmierung - sichere Standardwerte
        const canBuy = CurrentShop?.canBuy === true;
        const canSell = CurrentShop?.canSell === true;
        const showToggle = CurrentShop && canBuy && canSell;
        return (
                <div className="flex size-full flex-col gap-1">
                        <div className="flex w-full items-center justify-between gap-2">
                                <ShopTitle />
                                <div className="flex items-center gap-2">
                                        <PlayerData />
                                        {showToggle && (
                                                <Button
                                                        className="bg-indigo-700/30 text-indigo-200 hover:bg-indigo-600/40 transition-all duration-300 backdrop-blur-sm hover:scale-105"
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
                                        {canBuy && (
                                                <Button
                                                        className="bg-red-700/30 text-red-200 hover:bg-red-600/40 transition-all duration-300 backdrop-blur-sm hover:scale-105"
                                                        variant="secondary"
                                                        onClick={() => {
                                                                if (!isEnvBrowser()) fetchNui("startRobbery");
                                                        }}
                                                >
                                                        🔫 Ausrauben
                                                </Button>
                                        )}
                                        <Button
                                                size="icon"
                                                variant="ghost"
                                                className="hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 rounded-full hover:scale-110"
                                                onClick={() => {
                                                        if (!isEnvBrowser()) fetchNui("hideFrame");
                                                }}
                                        >
                                                <FontAwesomeIcon icon={faXmark} className="p-2 text-gray-400 hover:text-red-400 transition-colors" size="xl" />
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
