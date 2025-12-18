import { debugData } from "../utils/debugData";
import { VisibilityProvider } from "../providers/VisibilityProvider";
import DataHandler from "../DataHandler";
import ShopInterface from "./ShopInterface";
import { ShopItem } from "../types/ShopItem";
import { TooltipProvider } from "./ui/tooltip";

export default function App() {
	DataHandler();

	return (
		<TooltipProvider>
			<VisibilityProvider>
				<div className="h-screen w-screen">
					<div className="h-[84vh] w-[85%] rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl mx-auto my-[8vh] will-change-transform border border-orange-500/10">
						<div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5 pointer-events-none"></div>
						<div className="relative h-full">
							<ShopInterface />
						</div>
					</div>
				</div>
			</VisibilityProvider>
		</TooltipProvider>
	);
}

// Debug-Daten nur in Entwicklungsumgebung aktivieren
if (import.meta.env.DEV) {
	debugData([
		{
			action: "setVisible",
			data: true,
		},
	]);

	debugData([
		{
			action: "setCurrentShop",
			data: {
				shop: "247supermarket",
				label: "24/7 Supermarket",
				location: 1,
			},
		},
	]);

	debugData([
		{
			action: "setSelfData",
			data: {
				money: {
					Cash: 50.89,
					Bank: 200001.32,
				},
				weight: 1400,
				maxWeight: 14000,
				licenses: {
					weapon: true,
				},
			},
		},
	]);
}
