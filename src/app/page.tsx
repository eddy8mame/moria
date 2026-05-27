import MapComponent from './components/Map';

export default function Home() {
    return (
        <main className="flex flex-1 w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
            <MapComponent />
        </main>
    );
}
