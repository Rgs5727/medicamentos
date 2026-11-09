import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import RemedioPagina from "./components/RemedioPagina"
import RemedioPaginaNovo from "./components/RemedioPaginaNovo"
import RemedioPaginaEditar from "./components/RemedioPaginaEditar"
import Navbar from "./components/Navbar"
import Rodape from "./components/Rodape"
import Toasts from "./components/Toasts"
import RotaProtegida from "./components/RotaProtegida"
import RolarParaTopo from "./components/RolarParaTopo"
import PainelAdmin from "./components/PainelAdmin"
import PaginaDeErro from "./pages/PaginaDeErro"
import Home from "./pages/Home"
import RemedioDetalhe from "./pages/RemedioDetalhe"
import ComentarioEditar from "./pages/ComentarioEditar"
import Moderacao from "./pages/Moderacao"
import Categorias from "./pages/Categorias"
import CategoriaNova from "./pages/CategoriaNova"
import CategoriaEditar from "./pages/CategoriaEditar"
import MinhaConta from "./pages/MinhaConta"
import PerfilEditar from "./pages/PerfilEditar"
import EsqueciSenha from "./pages/EsqueciSenha"
import RedefinirSenha from "./pages/RedefinirSenha"
import Sobre from "./pages/Sobre"
import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import SessaoExpirada from "./pages/SessaoExpirada"
import MenuAdmin from "./pages/MenuAdmin"
import Usuarios from "./pages/Usuarios"
import { api, mensagemDeErro, guardarToken, pegarToken, apagarToken, pegarUsuarioLogado, definirAoExpirarSessao } from "./services/api"

const TEMPO_DO_TOAST = 5 * 1000                // o toast fecha sozinho depois de 5 s
const AVISO_ANTES_DE_EXPIRAR = 5 * 60 * 1000    // aviso quando faltam 5 min para o token vencer
const TOAST_ACOMPANHA_REDIRECIONAMENTO = 500    // ver "TROCOU DE PÁGINA" abaixo

function App(){
  const navigate = useNavigate()
  const location = useLocation()

  // ==========================================================================
  // QUEM ESTÁ LOGADO
  // Vem SEMPRE de GET /api/v1/auth/me ({ nome, email, adm, expira_em,
  // segundos_para_expirar }), nunca de dentro do token. O App guarda e passa
  // por props (Navbar, RotaProtegida, páginas), do mesmo jeito que o modelo
  // da livraria passa dados para os componentes.
  // ==========================================================================
  const [usuario, setUsuario] = useState(null)
  // Se já existe token guardado, espera a resposta do /auth/me antes de
  // decidir se uma página protegida pode abrir.
  const [carregandoUsuario, setCarregandoUsuario] = useState(() => Boolean(pegarToken()))
  // Logo depois de Sair / da sessão expirar, o React ainda desenha a página
  // atual uma última vez antes de levar a pessoa para a próxima. Guardamos a
  // "chave" dessa página para a RotaProtegida não mandar para /login no meio
  // do caminho. Trocou de página -> deixa de valer (ver "TROCOU DE PÁGINA").
  const [encerradaNaPagina, setEncerradaNaPagina] = useState(null)
  const encerrandoSessao = encerradaNaPagina !== null && encerradaNaPagina === location.key
  // Momento (no relógio deste navegador) em que a sessão acaba. É calculado
  // com os SEGUNDOS que o servidor diz que faltam, então não importa se o
  // relógio do computador está certo ou não: o navegador só mede o intervalo.
  const [prazoDaSessao, setPrazoDaSessao] = useState(null)
  // ids dos remédios favoritos de quem está logado (selo da navbar e corações)
  const [favoritos, setFavoritos] = useState([])

  // ==========================================================================
  // TOASTS (mensagens no canto da tela, iguais às do base.html antigo)
  // ==========================================================================
  const [toasts, setToasts] = useState([])
  const proximoIdDoToast = useRef(0)

  const fecharToast = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id))
  }, [])

  const mostrarToast = useCallback((texto, tipo = "success") => {
    proximoIdDoToast.current += 1
    const id = proximoIdDoToast.current
    setToasts((lista) => [...lista, { id, texto, tipo, criadoEm: Date.now() }])
    // Fecha sozinho depois de 5 s, se ninguém clicar no X antes
    setTimeout(() => fecharToast(id), TEMPO_DO_TOAST)
  }, [fecharToast])

  // ==========================================================================
  // TROCOU DE PÁGINA
  // No site antigo cada página nova recarregava tudo, então os toasts da
  // página anterior sumiam. Aqui fazemos o mesmo. A exceção é o toast criado
  // há menos de meio segundo: é o caso "mostra a mensagem e já redireciona"
  // (ex: login feito -> vai para outra página), e ele deve aparecer na
  // página nova, como o flash() do Flask.
  // (Feito durante a renderização, e não num useEffect, que é o jeito que a
  // documentação do React recomenda para "ajustar um estado quando algo muda".)
  // ==========================================================================
  const [paginaVista, setPaginaVista] = useState(location.key)
  if(paginaVista !== location.key){
    setPaginaVista(location.key)
    setEncerradaNaPagina(null)
    setToasts((lista) => lista.filter((t) => Date.now() - t.criadoEm < TOAST_ACOMPANHA_REDIRECIONAMENTO))
  }

  // Página atual guardada num ref para os timers (que rodam fora da renderização).
  // useLayoutEffect (e não useEffect): atualiza no MESMO instante em que a página
  // nova aparece na tela. Com useEffect sobrava um intervalo minúsculo em que um
  // timer (ex: a sessão expirando bem na hora de trocar de página) ainda leria a
  // página antiga e mandaria a pessoa para /login em vez de /sessao-expirada.
  const paginaAtual = useRef(location)
  useLayoutEffect(() => {
    paginaAtual.current = location
  }, [location])

  // ==========================================================================
  // FAVORITOS
  // ==========================================================================
  const carregarFavoritos = useCallback(async () => {
    try {
      const resposta = await api.get("/api/favoritos")
      setFavoritos(resposta.data.map((m) => m.remedio_id))
    } catch {
      // 401 é tratado pela sessão expirada; outros erros: fica sem o selo
    }
  }, [])

  // Coração do card e do detalhe: POST /api/favoritos/<id> coloca ou tira
  const alternarFavorito = useCallback(async (remedioId) => {
    try {
      const resposta = await api.post(`/api/favoritos/${remedioId}`)
      const virouFavorito = resposta.data.favorito
      setFavoritos((lista) => {
        const semEle = lista.filter((id) => id !== remedioId)
        return virouFavorito ? [...semEle, remedioId] : semEle
      })
      // Mesmas mensagens e cores do flash antigo
      mostrarToast(resposta.data.mensagem, virouFavorito ? "success" : "info")
    } catch (error) {
      if(error.response?.status !== 401){
        mostrarToast(mensagemDeErro(error), "danger")
      }
    }
  }, [mostrarToast])

  // ==========================================================================
  // ENTRAR, SAIR E SESSÃO EXPIRADA
  // ==========================================================================

  // Guarda o que o /auth/me respondeu (ou null = ninguém logado)
  function aplicarUsuario(dados){
    setUsuario(dados)
    setPrazoDaSessao(dados ? Date.now() + dados.segundos_para_expirar * 1000 : null)
    if(dados){
      carregarFavoritos()
    } else {
      setFavoritos([])
    }
  }

  // Chamado pelo Login (e pelo Cadastro) quando a API devolve o token
  async function entrar(token){
    guardarToken(token)                      // 1) guarda no localStorage
    const dados = await pegarUsuarioLogado() // 2) pergunta ao servidor quem é e quanto tempo falta
    aplicarUsuario(dados)
    return dados
  }

  // Depois de editar o perfil: pergunta de novo ao servidor (nome novo na navbar)
  async function atualizarUsuario(){
    const dados = await pegarUsuarioLogado()
    aplicarUsuario(dados)
  }

  // "Sair" da navbar: no JWT o logout é só apagar o token do navegador
  // (o servidor não guarda token nenhum). Igual ao /logout antigo: volta
  // para o início com o toast de despedida.
  function sair(){
    apagarToken()
    aplicarUsuario(null)
    setEncerradaNaPagina(location.key)
    mostrarToast("Desconectado com sucesso. Volte sempre!", "success")
    navigate("/")
  }

  // Token venceu (timer de 30 min) ou a API respondeu 401 para um pedido que
  // levou token: apaga o token e abre /sessao-expirada, guardando a página
  // atual para o "Entrar novamente" voltar para ela.
  const expirarSessao = useCallback(() => {
    const pagina = paginaAtual.current
    apagarToken()
    setUsuario(null)
    setPrazoDaSessao(null)
    setFavoritos([])
    setEncerradaNaPagina(pagina.key)
    navigate("/sessao-expirada", { state: { voltarPara: pagina.pathname + pagina.search + pagina.hash } })
  }, [navigate])

  // Os timers e o interceptor do axios rodam "fora" da renderização do
  // React; por isso eles chamam as funções por este ref, que sempre aponta
  // para a versão mais nova delas.
  const acoes = useRef({ expirarSessao, mostrarToast, aplicarUsuario })
  useEffect(() => {
    acoes.current = { expirarSessao, mostrarToast, aplicarUsuario }
  })

  // Ao abrir o site (uma vez só):
  //  - avisa o api.js o que fazer quando uma resposta 401 chegar;
  //  - se já existe token guardado, pergunta GET /api/v1/auth/me quem é o dono.
  useEffect(() => {
    definirAoExpirarSessao(() => acoes.current.expirarSessao())

    async function carregarUsuario(){
      const dados = await pegarUsuarioLogado()
      acoes.current.aplicarUsuario(dados)
      setCarregandoUsuario(false)
    }

    if(pegarToken()){
      carregarUsuario()
    }
  }, [])

  // Os dois relógios da sessão (o token vale 30 min):
  //  - faltando 5 min -> toast de aviso (uma vez só para cada sessão)
  //  - chegou a hora  -> expirarSessao()
  const avisoJaMostrado = useRef(null)
  useEffect(() => {
    if(!prazoDaSessao){
      return
    }
    const falta = prazoDaSessao - Date.now()

    const timerDoAviso = setTimeout(() => {
      if(avisoJaMostrado.current !== prazoDaSessao){
        avisoJaMostrado.current = prazoDaSessao
        acoes.current.mostrarToast("Sua sessão expira em 5 minutos", "warning")
      }
    }, Math.max(0, falta - AVISO_ANTES_DE_EXPIRAR))

    const timerDaExpiracao = setTimeout(() => acoes.current.expirarSessao(), Math.max(0, falta))

    // Saiu, logou de novo ou a sessão mudou: desliga os relógios antigos
    return () => {
      clearTimeout(timerDoAviso)
      clearTimeout(timerDaExpiracao)
    }
  }, [prazoDaSessao])

  // Páginas que exigem login (exigirAdmin: só administrador; os outros veem a 403)
  function protegida(pagina, exigirAdmin = false){
    return (
      <RotaProtegida usuario={usuario} carregando={carregandoUsuario} exigirAdmin={exigirAdmin}
        encerrandoSessao={encerrandoSessao} mostrarToast={mostrarToast}>
        {pagina}
      </RotaProtegida>
    )
  }

  const favoritosDoUsuario = usuario ? favoritos : []

  // Mesma ordem do base.html antigo: navbar, toasts, conteúdo, painel admin, rodapé
  return (
    <>
      <RolarParaTopo />
      <Navbar usuario={usuario} qtdFavoritos={favoritosDoUsuario.length} aoSair={sair} />

      <Toasts toasts={toasts} adm={Boolean(usuario?.adm)} aoFechar={fecharToast} />

      <main className="main-content">
        <Routes>
           <Route path="/" element={<Home usuario={usuario} favoritos={favoritosDoUsuario}
              aoFavoritar={alternarFavorito} mostrarToast={mostrarToast} />} />
           <Route path="/remedios/:id" element={<RemedioDetalhe usuario={usuario} favoritos={favoritosDoUsuario}
              aoFavoritar={alternarFavorito} mostrarToast={mostrarToast} />} />

           {/* Gerenciar remédios: tabela do modelo da livraria (dentro do .container, como no modelo) */}
           <Route path="/remedios" element={protegida(<div className="container"><RemedioPagina usuario={usuario} mostrarToast={mostrarToast} /></div>)} />
           {/* Formulários: visual do cadastrar/editar_medicamento.html antigo (já têm o próprio container) */}
           <Route path="/remedio_novo" element={protegida(<RemedioPaginaNovo mostrarToast={mostrarToast} />)} />
           <Route path="/remedios/:id/editar" element={protegida(<RemedioPaginaEditar usuario={usuario} mostrarToast={mostrarToast} />)} />

           <Route path="/comentarios/:id/editar" element={protegida(<ComentarioEditar usuario={usuario} mostrarToast={mostrarToast} />)} />

           {/* Categorias: listar é público; cadastrar/editar exigem login (editar: dono ou admin) */}
           <Route path="/categorias" element={<Categorias usuario={usuario} mostrarToast={mostrarToast} />} />
           <Route path="/categoria_nova" element={protegida(<CategoriaNova usuario={usuario} mostrarToast={mostrarToast} />)} />
           <Route path="/categorias/:id/editar" element={protegida(<CategoriaEditar usuario={usuario} mostrarToast={mostrarToast} />)} />

           {/* Só administrador */}
           <Route path="/moderacao" element={protegida(<Moderacao usuario={usuario} mostrarToast={mostrarToast} />, true)} />

           <Route path="/login" element={<Login aoEntrar={entrar} mostrarToast={mostrarToast} />} />
           <Route path="/cadastro" element={<Cadastro aoEntrar={entrar} mostrarToast={mostrarToast} />} />
           <Route path="/sessao-expirada" element={<SessaoExpirada />} />

           {/* Conta, senha e Sobre */}
           <Route path="/conta" element={protegida(<MinhaConta usuario={usuario} favoritos={favoritosDoUsuario}
              aoFavoritar={alternarFavorito} mostrarToast={mostrarToast} />)} />
           <Route path="/conta/editar" element={protegida(<PerfilEditar usuario={usuario}
              aoAtualizarUsuario={atualizarUsuario} mostrarToast={mostrarToast} />)} />
           <Route path="/esqueci-senha" element={<EsqueciSenha mostrarToast={mostrarToast} />} />
           <Route path="/redefinir-senha/:token" element={<RedefinirSenha mostrarToast={mostrarToast} />} />
           <Route path="/sobre" element={<Sobre />} />

           {/* Painel admin: Menu do Administrador e Controle de Usuários (só administrador) */}
           <Route path="/menu" element={protegida(<MenuAdmin usuario={usuario} />, true)} />
           <Route path="/usuarios" element={protegida(<Usuarios usuario={usuario} mostrarToast={mostrarToast} />, true)} />

           <Route path="*" element={<div className="container"><PaginaDeErro/></div>} />
        </Routes>
      </main>

      {/* Painel lateral do admin; "key" faz ele começar fechado a cada página, como no antigo */}
      {usuario?.adm ? <PainelAdmin key={location.key} /> : null}

      <Rodape />
    </>
  )
}

export default App
