import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import '../App.css'

export default function PosLayout() {
    return (
        <div className="pos-bg">
            <div className="pos-container">

                <header className="pos-header">
                    <Header />
                </header>

                <main className="pos-main">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}
