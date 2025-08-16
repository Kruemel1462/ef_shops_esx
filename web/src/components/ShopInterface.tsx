import Cart from "./Cart";
import SellCart from "./SellCart";
import ShopGrid from "./ShopGrid";
import { fetchNui } from "../utils/fetchNui";
import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { 
	faCreditCard, 
	faMoneyBill1Wave, 
	faXmark, 
	faUsers, 
	faStore, 
	faShoppingCart, 
	faHandshake, 
	faMask, 
	faGem, 
	faCar, 
	faGun, 
	faPills, 
	faUtensils, 
	faGasPump,
	faWrench,
	faShirt,
	faMobile,
	faLaptop,
	faHome,
	faBriefcase
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatMoney, isEnvBrowser } from "../utils/misc";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

// Funktion um passende Icons basierend auf Shop-Namen zu finden
function getShopIcon(shopId: string) {
	const shopIdLower = shopId.toLowerCase();
	
	if (shopIdLower.includes('247') || shopIdLower.includes('supermarket')) return faStore;
	if (shopIdLower.includes('ammunation') || shopIdLower.includes('gun')) return faGun;
	if (shopIdLower.includes('pharmacy') || shopIdLower.includes('pill')) return faPills;
	if (shopIdLower.includes('restaurant') || shopIdLower.includes('food')) return faUtensils;
	if (shopIdLower.includes('gas') || shopIdLower.includes('fuel')) return faGasPump;
	if (shopIdLower.includes('mechanic') || shopIdLower.includes('auto')) return faWrench;
	if (shopIdLower.includes('clothing') || shopIdLower.includes('clothes')) return faShirt;
	if (shopIdLower.includes('phone') || shopIdLower.includes('mobile')) return faMobile;
	if (shopIdLower.includes('computer') || shopIdLower.includes('laptop')) return faLaptop;
	if (shopIdLower.includes('jewelry') || shopIdLower.includes('gem')) return faGem;
	if (shopIdLower.includes('car') || shopIdLower.includes('vehicle')) return faCar;
	if (shopIdLower.includes('pawn') || shopIdLower.includes('sell')) return faHandshake;
	if (shopIdLower.includes('home') || shopIdLower.includes('furniture')) return faHome;
	if (shopIdLower.includes('office') || shopIdLower.includes('business')) return faBriefcase;
	
	// Standard Icons
	return faStore;
}

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

	const shopIcon = getShopIcon(CurrentShop?.id || '');
	
	return (
		<div className="ml-6 flex items-center gap-4">
			<div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl shadow-lg shadow-purple-500/20 border border-purple-500/30">
				<FontAwesomeIcon 
					icon={shopIcon} 
					size="2xl" 
					className="text-purple-300 drop-shadow-lg"
				/>
			</div>
			<div className="flex flex-col">
				<h1 className="text-4xl font-bold text-shadow-lg shadow-purple-500/20">
					{CurrentShop?.label}
				</h1>
				<p className="text-sm text-muted-foreground/70 font-medium">
					{CurrentShop?.location ? `Standort ${CurrentShop.location}` : 'Verfügbar'}
				</p>
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
                <div className="flex gap-2">
                        <p className="flex items-center gap-2 rounded-md bg-green-700/20 px-5 py-1 text-lg font-bold leading-none text-green-400 shadow-lg shadow-green-500/10">
                                <FontAwesomeIcon size="xl" icon={faMoneyBill1Wave} />
                                {"$" + formatMoney(Money.Cash)}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-blue-600/20 px-5 py-1 text-lg font-bold leading-none text-blue-400 shadow-lg shadow-blue-500/10">
                                <FontAwesomeIcon size="xl" icon={faCreditCard} />
                                {"$" + formatMoney(Money.Bank)}
                        </p>
                        {Money.Society > 0 && (
                                <p className="flex items-center gap-2 rounded-md bg-orange-600/20 px-5 py-1 text-lg font-bold leading-none text-orange-400 shadow-lg shadow-orange-500/10">
                                        <FontAwesomeIcon size="xl" icon={faUsers} />
                                        {"$" + formatMoney(Money.Society)}
                                </p>
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
                                                        className="bg-indigo-700/20 text-indigo-300 hover:bg-indigo-800/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
                                                        variant="secondary"
                                                        onClick={() => {
                                                                if (!SellingMode) {
                                                                        fetchNui("getInventory", { shop: CurrentShop?.id });
                                                                }
                                                                setSellingMode(!SellingMode);
                                                        }}
                                                >
                                                        <FontAwesomeIcon 
                                                                icon={SellingMode ? faShoppingCart : faHandshake} 
                                                                className="mr-2" 
                                                                size="sm" 
                                                        />
                                                        {SellingMode ? "Kaufen" : "Verkaufen"}
                                                </Button>
                                        )}
                                        {canBuy && (
                                                <Button
                                                        className="bg-red-700/20 text-red-300 hover:bg-red-800/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                                                        variant="secondary"
                                                        onClick={() => {
                                                                if (!isEnvBrowser()) fetchNui("startRobbery");
                                                        }}
                                                >
                                                        <FontAwesomeIcon 
                                                                icon={faMask} 
                                                                className="mr-2" 
                                                                size="sm" 
                                                        />
                                                        Ausrauben
                                                </Button>
                                        )}
                                        <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                        if (!isEnvBrowser()) fetchNui("hideFrame");
                                                }}
                                        >
                                                <FontAwesomeIcon icon={faXmark} className="p-2" size="xl" />
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
