import Cart from "./Cart";
import SellCart from "./SellCart";
import ShopGrid from "./ShopGrid";
import { fetchNui } from "../utils/fetchNui";
import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { faCreditCard, faMoneyBill1Wave, faXmark, faUsers, faStore, faHandHoldingDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatMoney, isEnvBrowser } from "../utils/misc";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

function ShopTitle() {
	const { CurrentShop } = useStoreShop();

	if (!CurrentShop)
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-32 rounded-full" />
					<Skeleton className="h-3 w-24 rounded-full" />
				</div>
			</div>
		);

	return (
		<div className="flex items-center gap-3">
			<div className="rounded-xl bg-primary/20 p-2.5 backdrop-blur-sm">
				<FontAwesomeIcon icon={faStore} className="text-primary text-xl" />
			</div>
			<div>
				<h1 className="text-2xl font-bold text-foreground">{CurrentShop?.label}</h1>
				<p className="text-sm text-muted-foreground">Shop #{CurrentShop?.location}</p>
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
                <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2 backdrop-blur-sm transition-all hover:bg-green-500/15">
                                <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faMoneyBill1Wave} className="text-green-400" />
                                        <div className="flex flex-col">
                                                <span className="text-xs text-green-400/80 font-medium">Bargeld</span>
                                                <span className="text-sm font-bold text-green-400">{"$" + formatMoney(Money.Cash)}</span>
                                        </div>
                                </div>
                        </div>
                        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2 backdrop-blur-sm transition-all hover:bg-blue-500/15">
                                <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCreditCard} className="text-blue-400" />
                                        <div className="flex flex-col">
                                                <span className="text-xs text-blue-400/80 font-medium">Bank</span>
                                                <span className="text-sm font-bold text-blue-400">{"$" + formatMoney(Money.Bank)}</span>
                                        </div>
                                </div>
                        </div>
                        {Money.Society > 0 && (
                                <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-2 backdrop-blur-sm transition-all hover:bg-orange-500/15">
                                        <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faUsers} className="text-orange-400" />
                                                <div className="flex flex-col">
                                                        <span className="text-xs text-orange-400/80 font-medium">Firma</span>
                                                        <span className="text-sm font-bold text-orange-400">{"$" + formatMoney(Money.Society)}</span>
                                                </div>
                                        </div>
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
                <div className="flex size-full flex-col gap-4">
                        <div className="flex w-full items-center justify-between gap-4 rounded-xl bg-card/30 p-4 backdrop-blur-sm border border-border/50">
                                <ShopTitle />
                                <div className="flex items-center gap-3">
                                        <PlayerData />
                                        <div className="h-8 w-px bg-border/50" />
                                        <div className="flex items-center gap-2">
                                                {showToggle && (
                                                        <Button
                                                                className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/20 hover:border-indigo-500/30 backdrop-blur-sm transition-all duration-300"
                                                                variant="secondary"
                                                                onClick={() => {
                                                                        if (!SellingMode) {
                                                                                fetchNui("getInventory", { shop: CurrentShop?.id });
                                                                        }
                                                                        setSellingMode(!SellingMode);
                                                                }}
                                                        >
                                                                <FontAwesomeIcon icon={faHandHoldingDollar} className="mr-2" />
                                                                {SellingMode ? "Kaufen" : "Verkaufen"}
                                                        </Button>
                                                )}
                                                {canBuy && (
                                                        <Button
                                                                className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/20 hover:border-red-500/30 backdrop-blur-sm transition-all duration-300"
                                                                variant="secondary"
                                                                onClick={() => {
                                                                        if (!isEnvBrowser()) fetchNui("startRobbery");
                                                                }}
                                                        >
                                                                Ausrauben
                                                        </Button>
                                                )}
                                                <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                                                        onClick={() => {
                                                                if (!isEnvBrowser()) fetchNui("hideFrame");
                                                        }}
                                                >
                                                        <FontAwesomeIcon icon={faXmark} size="lg" />
                                                </Button>
                                        </div>
                                </div>
			</div>
                        <div className="flex h-0 w-full grow items-center gap-4">
                                <ShopGrid />
                                {SellingMode ? <SellCart /> : <Cart />}
                        </div>
                </div>
        );
}
