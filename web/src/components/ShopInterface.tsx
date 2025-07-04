import Cart from "./Cart";
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

	return <h1 className="ml-6 text-4xl font-bold">{CurrentShop?.label}</h1>;
}

function PlayerData() {
	const { Money } = useStoreSelf();

	if (!PlayerData) return null;

        return (
                <div className="flex gap-2">
                        <p className="flex items-center gap-2 rounded-md bg-green-700/20 px-5 py-1 text-lg font-bold leading-none text-green-400">
                                <FontAwesomeIcon size="xl" icon={faMoneyBill1Wave} />
                                {"$" + formatMoney(Money.Cash)}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-blue-600/20 px-5 py-1 text-lg font-bold leading-none text-blue-400">
                                <FontAwesomeIcon size="xl" icon={faCreditCard} />
                                {"$" + formatMoney(Money.Bank)}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-orange-600/20 px-5 py-1 text-lg font-bold leading-none text-orange-400">
                                <FontAwesomeIcon size="xl" icon={faUsers} />
                                {"$" + formatMoney(Money.Society)}
                        </p>
                </div>
        );
}

export default function ShopInterface() {
        const { SellingMode, setSellingMode } = useStoreShop();
        return (
                <div className="flex size-full flex-col gap-1">
                        <div className="flex w-full items-center justify-between gap-2">
                                <ShopTitle />
                                <div className="flex items-center gap-2">
                                        <PlayerData />
                                        <Button
                                                className="bg-indigo-700/20 text-indigo-300 hover:bg-indigo-800/20"
                                                variant="secondary"
                                                onClick={() => {
                                                        if (!SellingMode) fetchNui("getInventory");
                                                        setSellingMode(!SellingMode);
                                                }}
                                        >
                                                {SellingMode ? "Kaufen" : "Verkaufen"}
                                        </Button>
                                        <Button
                                                className="bg-red-700/20 text-red-300 hover:bg-red-800/20"
                                                variant="secondary"
                                                onClick={() => {
                                                        if (!isEnvBrowser()) fetchNui("startRobbery");
                                                }}
                                        >
                                                Ausrauben
                                        </Button>
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
                                {!SellingMode && <Cart />}
                        </div>
                </div>
        );
}
