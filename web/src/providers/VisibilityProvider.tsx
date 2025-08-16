import React, { Context, createContext, useContext, useEffect, useState } from "react";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { fetchNui } from "../utils/fetchNui";
import { isEnvBrowser } from "../utils/misc";
import { motion } from "framer-motion";

const VisibilityCtx = createContext<VisibilityProviderValue | null>(null);

interface VisibilityProviderValue {
	setVisible: (visible: boolean) => void;
	visible: boolean;
}

export const VisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [visible, setVisible] = useState(false);

	useNuiEvent<boolean>("setVisible", setVisible);

	// Handle pressing escape/backspace
	useEffect(() => {
		// Only attach listener when we are visible
		if (!visible) return;

		const keyHandler = (e: KeyboardEvent) => {
			if (["Escape"].includes(e.code)) {
				if (!isEnvBrowser()) fetchNui("hideFrame");
				else setVisible(!visible);
			}
		};

		window.addEventListener("keydown", keyHandler);

		return () => window.removeEventListener("keydown", keyHandler);
	}, [visible]);

	return (
		<VisibilityCtx.Provider
			value={{
				visible,
				setVisible,
			}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ 
					opacity: visible ? 1 : 0, 
					scale: visible ? 1 : 0.95,
					y: visible ? 0 : 20
				}}
				transition={{ 
					duration: 0.15, 
					ease: [0.4, 0, 0.2, 1],
					type: "tween"
				}}
				style={{ 
					height: "100%",
					willChange: "transform, opacity"
				}}
			>
				{children}
			</motion.div>
		</VisibilityCtx.Provider>
	);
};

export const useVisibility = () => useContext<VisibilityProviderValue>(VisibilityCtx as Context<VisibilityProviderValue>);
