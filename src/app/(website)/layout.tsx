export const metadata={robots:{index:true,follow:true}};
import {WebsiteFrame} from "@/components/website/frame";
export default function Layout({children}:{children:React.ReactNode}){return <WebsiteFrame>{children}</WebsiteFrame>}
