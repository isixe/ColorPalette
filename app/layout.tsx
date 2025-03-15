import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
	title: "Color Palette",
	description: "Color Palette Tools",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<link rel="icon" href="/favicon.ico" sizes="any" />
			<body>{children}</body>
		</html>
	);
}
