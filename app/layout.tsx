import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Tina 3D Tesla | Model Y 交互拆解工作室',icons:{icon:'/favicon.svg?v=tina-2'},description:'探索 Tesla Model Y 的立体结构。中英双语、360° 旋转、渐进拆解与独立部件观察。An independent interactive Model Y structure study.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}

