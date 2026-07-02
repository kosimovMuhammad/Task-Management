export function Loader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[loader_1s_ease-in-out_infinite] bg-primary" />
      <style>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
