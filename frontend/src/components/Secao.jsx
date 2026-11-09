function Secao({titulo, children}){
    return (
    <>
    <section className="my-5">
        <div className="d-flex justify-content-between align-item-center">
            <h3>{titulo}</h3>
        </div>
        {children}
    </section>
    </>
    )
}

export default Secao