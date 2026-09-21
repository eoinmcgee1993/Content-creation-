import "./globals.css";
export const metadata={title:"DEGEN DIARIES",description:"The twice-weekly newspaper for the internet age."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}