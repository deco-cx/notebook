Tiago Gimenes
Instala pacotes e execution sandbox, que é um terminal. E aí, como é um WebOS, você pode sempre abrir um terminal novo, rodar uma coisa nova lá, instalar mais pacote ou procurar de um marketplace. E tem a sua storage. Então a gente tem essas três coisas aqui do WebOS. Eu acho que o WebOS em si é só um monte de... Libs e APIs. Não tem... é Redis mesmo. Não tem Redis aqui. É só um monte de Libs mais API que te deixa fazer. Aí, por exemplo, esse package manager aqui, ele entende um protocolo, que é um .mcp, sei lá, que é um RL token. Então, sempre que você tem um RL mais token, assim, você instala, consegue instalar um MCP. Basicamente, acho que é isso. É o nosso .xz. Beleza. Aí, todo sistema operacional consegue funcionar isso, só que é só um terminal. A gente geralmente precisa de uma GUI, que no caso do Linux é o Gnome, ou XFCE, ou esse desktop app aqui do Mac. E pra mim, esse é o DecoSMS. Exatamente é a parte da shell, a shell do sistema. Só que ele, mesmo é uma app do sistema. Tanto é que no Linux você pode trocar o gnome pelo xfce e vice-versa. Então ele tem uma layer de HTTP com barra mcp lá e ele tem um asterisco, que quando você entra em decocms.com, por exemplo, você cai no asterisco. E aí você vê o quê? Você vê essa visualização aqui. No desktop e no mobile. No meu bloco, no meio aqui, é uma view. E aí, qual que é a... Acho que a... A grande pegada daqui. O DecoCMS, ele define que o menu fica na esquerda, tem um chat na direita e tem, sei lá, uma view aqui no meio. Então, ele define alguns bindings que as apps vão ter que implementar se elas quiserem interagir com o sistema. Então, por exemplo, igual o Gnome, o Gnome também tem esse menu de notificações que a gente tem aqui no Mac, né, que aparece aqui na notificação, ou o Dock, né, que aparece quando você pega aqui embaixo no Mac. Do mesmo jeito... A gente tem isso também, inclusive, né? Menu de notificação, é, exato. E eu acho que, do mesmo jeito, Ah, essa aplicação de DecoCMS tem isso, então ela define... os binds, de como é que você entra no menu e o que o menu consegue fazer. Como é que você adiciona coisas no chat e o que o chat pode fazer. E como é que você adiciona coisas nessa view do meio e o que essa view pode fazer. Beleza. Aí eu tava pensando, tá, mas pra que que serve tudo isso, né? Por que que você tá pensando em tudo isso? Eu tô pensando no caso do... Vou pegar um caso da... da farm. Por causa da farm, o que que a gente tem? Eu tava pensando em... Eu tô fazendo um workspace pra farm. O que que eu faço? Eu faço um pacman aí, admin, o deco.cx admin, sei lá. Aí então eu vou instalar o deco.cx e vou instalar Sei lá, a Vettex, talvez. Alguma coisa assim. Ou a app de Workingflows. A app de Workingflows é boa. Pronto. Eu instalo essas duas apps. O que acontece? Como eu instalo essas duas apps, essas duas apps foram feitas para funcionar no DevXMS. Então elas implementaram alguns bindings aqui, desse cara aqui. para aparecer aqui no menu. Então, quando eu instalar essas duas apps aqui, por exemplo, vai aparecer algumas coisas que elas botaram no meu menu. Então, a dex.exe vai aparecer aqui, sei lá. Pages. E esse aqui vai aparecer o work. Quando eu clicar em Pages, ele tem lá cadastrado uma coisa para abrir navio. ele cadastra, não sei lá, uma coisa na view e no chat, não sei lá, ainda com textos. Não pensei muito nisso ainda, está meio aberto. Mas aí, sei lá, eu cliquei em paste, apareceu a lista de páginas e aí apareceu o chat, ele é meio que configurado com alguma coisa que o Deco CX conseguiu, quer, né? 

Luciano Júnior
Então, eu queria propor começar a testar qual seria essa API aí, do lado de onde o chat é first class. E não precisa informar nada para ele. E ele é totalmente informado. Por o conjunto de tools que aquela view está usando e as tools desse aí tem um nível de prioridade assim que ele tem acesso. O primeiro são as tools que aquela view está usando ali ou para mostrar dado ou para fazer um botão. Aí depois todas as tools desse mesmo app instalado no MCP e depois todas as tools do sistema tipo se eu quiser pedir para ele tipo navegue ele navega. Eu acho com esse modelo, a única coisa que fica faltando é eu quero fazer um arroba a partir de uma ação dentro dessa view. Tipo, eu começaria dessa coisa bem mínima, que é só passar pra cima, que aí não precisa você passar pra cima necessariamente, né, porque vai ter um RealtimeFS que pode ter um barra, barra UZR, barra Select, pra fazer um API em cima do File System sempre. onde dentro da view, se o usuário clicar no negócio, aí eu acho que isso dá para usar para o editor de workflow, para o editor de section e páginas, para qualquer tipo de coisa. Se o usuário clicar numa parada, o código emite para cima alguma coisa que faz no chat mostrar aquele sistema, que é a experiência do cursor, tá ligado? Eu tenho quase certeza que isso vai ser uma boa forma de começar. Pode ser. 

Tiago Gimenes
É um... Por exemplo, você clicou na lista de páginas, né? Aí você clicou numa paginazinha vermelha aqui. Aí você meio que... O chat, né? Aqui ele estava com um arroba... PageList, alguma coisa assim, né? Quando você clicou nessa página aqui, ele abre, né? A página fica vermelhinha. É uma coisa assim, né? Aí ele abre a página lá. Ele sabe que você está falando do Arroba Home. É uma coisa assim, né? 

Luciano Júnior
Isso. E se dentro da Home tem aquele negócio lá, naquele... Se tiver um... Vai ter um preview, eu acho, aí, né? Um preview do site. Aí ele pode fazer um... Jogar pra cima. a section selecionada, porque quase sempre a situação vai ser, na view, eu vou estar renderizando um JSON. Quase sempre é isso. E aí, às vezes, eu quero o usuário que é pinpoint parte desse JSON para editar. Eu acho que é só essa API, tipo, joga... Não sei o que é, mas tipo, é uma parte do resource, tá ligado? É uma parte da ROM, no final. 

Tiago Gimenes
Sim, sim, é um recurso, né? É um recurso do MCPM. Mas eu acho que é por aí também, é tipo, vai ter as pages que você entra, vai ter uma lista e você vai navegando, é a mesma View, mudou, mas quando você vai clicando aqui ele vai botando coisas no chat. 

Luciano Júnior
Isso, talvez tenha que resolver o probleminha de navegação interna, né, pra você mandar o link pra outra pessoa e tá aí, porque isso parece um iframe, acredito, né? Mas é bem tranquilo, assim, nada fora do normal. 

Tiago Gimenes
E aí o chat, ele vai meio que entendendo o que você está referenciando aqui. Beleza. E aí, cara, eu acho que é mais ou menos. 

Luciano Júnior
A melhor parte de trabalhar com coisas difíceis é que elas são difíceis, mas no critério de verificabilidade é muito fácil saber como é a solução, porque a solução sempre é simples, tá ligado? 

Tiago Gimenes
Então, exato. E aí... E aí, beleza. Aí, por exemplo, tem um Workflows aqui. Pra você criar um Workflows, você clica aqui, vai abrir uma coisa de Workflows, que ele vai conseguir se falar no chat e tal. Aí, o que eu tava pensando? Imagina que eu tenha, sei lá, instalei também uma appzinha de views aqui. 

Luciano Júnior
Chamei o Paulo para entrar, Pai Doei. 

Tiago Gimenes
Imagina que você tem uma appzinha de views aqui, tá? Olha aí, Paulo. Você pode pegar esse appzinho de Views, vai abrir o negócio da app de Views aqui. E a parte legal é que ela pode usar coisas do sistema aqui para executar um terminal e subir uma máquina e fazer a porra toda. Sim, mas... 

Luciano Júnior
Por que isso é diferente da Pages pra você? Ou é a mesma coisa? 

Tiago Gimenes
Então, porque eu acho que isso aqui é uma agregação de MCPs e coisas que eles dão suporte a, entendeu? 

Luciano Júnior
Esse frame do desktop, ele é um Anvil pra você? O tudo? A tela toda? 

Tiago Gimenes
Ele... Cara, pra mim, pode ser uma View, mas eu acho que ele é um... Cai nesse caso aqui, de que cai num... Num limbo aqui. 

Luciano Júnior
Mas pra renderizar a View de dentro ali, a Pages, o Workflows, também é assim ou é de outra forma? Como é que essa View existe? 

Tiago Gimenes
Eu acho que o DocsMS tem um... Ela define o que é uma View. E aí, tipo, esses caras aqui meio que implementam isso e cai nesse nosso CMS. 

Luciano Júnior
Certo, mas ele aponta para a Vue através de uma tool apontando para uma URL do webapp. barra, alguma parada. 

Tiago Gimenes
É isso, é isso. 

Luciano Júnior
Perfeito. 

Tiago Gimenes
E aí, o que é o nosso bicho? O nosso bicho... 

Luciano Júnior
Eu acho mais simples não ter menu de views nesse caso, porque aí já está contemplado o conceito. Pode ser. 

Tiago Gimenes
Então, vamos colocar aqui um menu de... 

Luciano Júnior
Tipo, acho que quando você explica o view ali em cima, que vai pra lá, fica bem claro isso. Aí quando vai para Views aí, tipo, em Views eu deveria ver Pages? Eu deveria ver Views, que tá no menu? Aí tipo, acho que poderia só não ter esse exemplo. 

Tiago Gimenes
Tá, então vamos fazer um cara aqui de Tools. Complicador de Tools aqui. Tá? Sim. Esse carinha de tools aqui, ele tem a mesma coisa. Mostra suas tools, você clica na tool, você entra na tool e tal. E aí, quando você quiser rodar a tool, como ele está rodando em cima do seu WebOS, ele tem essas libs e APIs para rodar um código aleatório no seu workspace. Faz sentido? 

Luciano Júnior
Com o sistema de permissões, né? 

Tiago Gimenes
Isso, exato. Então, aí eu acho que todo o sistema de permissão está tudo aqui também. E... acho que é por aí. Então, ele pega aqui e consegue rodar coisas de máquinas aqui. E a gente... E a gente pode fazer, no DecoCMS, um binding aqui de runnable ou... runnable ou... execute double code, sei lá, alguma coisa assim, sabe? Que quando o seu MCP implementa esse negócio, o chat aqui sabe pegar e mostrar e sabe abrir uma view que roda, sabe fazer o feedback loop com ele. 

Luciano Júnior
Então, você não está largando a abstração no nível de que Tavano iria implementar o preview? Você daria o quê para ele a mais? Esse runnable executable code? Queria saber onde é que está o nível de abstração que ele está. 

Tiago Gimenes
Eu acho, para o Tavano, eu acho que ele já consegue rodar, né? Então, ele não usaria do WebOS esse Execution Sandbox. O que eu daria para ele é, se você implementa um, sei lá, RunCode, todos com nome, RunCode, UpdateCode, ou sei lá, GetLogs, alguma coisa assim, eu consigo, o meu agente aqui, meu chat, sabe que ele tem que fazer um depois do outro, edita e depois escreve o código e consegue ver se ele consegue chupar uns logs, sei lá, alguma coisa assim. 

Luciano Júnior
Tem que pensar mais nisso. Vai ser importante se emergir esse negócio aí. É difícil coordenar. Não sei se é difícil coordenar. Tem muito código que vai ser Tem um botão que você aperta, né? Tem um botão que você aperta e acontece um negócio ali. Ou eu acompanho, é um workflow que fica o negócio lá. Eu acho que tem que ter um suporte default a lidar com, esperar workflows nesse sistema. Talvez seja o sistema de notificações. 

Tiago Gimenes
Pode ser. Eu acho que o Binding de Workflows também pode ficar aqui, tá? Então, o que que é o Binding de Workflows? Quando você entra nesse... Ah, eu só estou configurando aqui. Deixa eu ver se consigo... Windows. Cara, quando você entra no AISDK e vê as docs deles, Tem algumas coisas que fazem sentido pra mim. Que é o seguinte... É... Que eu tava lendo, né? E ele falou assim... Ah, é... Faz um... Generative User Interface. Eu falei, caralho, os caras fizeram umas paradas muito loucas. Quando você vai ver, cara, é uma implementação bosta aqui. 

Luciano Júnior
É um if, é um switch case com o resultado do toCall, né? Switch case. 

Tiago Gimenes
Com, renderizando componentes pré-build, tá ligado? 

Luciano Júnior
Total, tipo, nem, é... 

Tiago Gimenes
Esse aqui, tá ligado? Ele faz um switch case com componentes pré-build. 

Luciano Júnior
Isso é a síndrome de só construir as coisas em cima do que veio antes. Aí, tipo, não conseguir pegar o breakthrough tecnológico de, cara, para, Reviso tudo e venho de outro lugar. O que é que dá para fazer com isso, tá ligado? Claro, tem que ter hindsight e ter esperado muito tempo, né? 

Tiago Gimenes
Então, aí... É... Eu acho... Que... O... A gente tem que ter um bind aqui de... Sei lá. Pra ele botar qualquer coisa aqui no chat, sabe? Que ele consegue renderizar alguma coisa. 

Luciano Júnior
É muito parecido com o Vue, né? Tipo, eu acho que se você já fez o bind de Vue, se a Vue já consegue mandar um arroba para o agente, é dois pulos para ser a Vue já, eu acho. 

Tiago Gimenes
Exato, pode ser a Vue. Mas eu acho também que tem um bind de Workflows, por exemplo. Por quê? Se o próprio DexMS tem um bind de Workflows, ele consegue renderizar um Workflows que vai indo assim e ele para, sei lá. Você consegue ver o workflow executando. Tipo aquele TUDO do... Você já viu aquele TUDO LIST do curso? 

Luciano Júnior
Já. É... Eu acho que sim... Assim, eu acho que ele é mais legal... Detection do chat. É... Como se fosse um pending job, tá ligado? Tem alguns softwares que tem isso. Que você... É... O negócio vai ficar dois minutos rodando. Aí ele vai para a sua. É como se ele fosse para a sua barra de notificações. A sua barra de notificações ela fica o que termina mas fica o que está rodando também. Eu acho que poderia ser isso também porque eu imagino o chat você tipo você não vai querer ficar. Você vai querer fazer outras coisas falar com ele. Talvez você não queria perder esse workflow rodando. Tem uma coisa do design aí para ver, Valus, de como que lida bem com isso. 

Rafael Valls
Pode ser. 

Tiago Gimenes
Isso, e aí, tipo, por isso que eu acho que tanta definição de... Porque, eventualmente, também, quando você mexe numa página aqui, numa lista de páginas, você está falando com o chat, essa view aqui, tem alguns... ela está aí. A Vue expõe contexto para o chat, tá ligado? 

Luciano Júnior
Eu acho que ela expõe contexto no sentido de que todas as toolcalls delas são registradas no nosso sistema, passam pelo nosso RPC. Esse frame aí de desktop, ele deve saber quais são essas tool calls e elas estarem nos available tools desse agente, e quais foram o resultado das chamadas, quando são tool calls que abre a view e carrega dados. tá ligado? Aí isso faria só essas duas coisas, eu acho que já resolve tudo. Na lista de páginas, o agente vai ter acesso ao list pages, que poderia ter tipo uma paginação extra, e ter acesso às 10 páginas que carregaram. Se tiver paginação, paginação vai ser um tool call da Vue, um RPC. Aí, página 2, tudo aquilo vai entrando no contexto. Eu acho que poderia ser nesse nível, tá ligado? Seria muito simples e poderoso. 

Tiago Gimenes
Resultado da sua causa viu entrar e não contestou a gente. Pode ser. Pode ser. Pode ter um arroba que você faz e aparece recent results. 

Luciano Júnior
Isso, isso. 

Tiago Gimenes
Eu acho bom. 

Luciano Júnior
Se conseguir capturar o console log do browser também seria muito bom. Não sei se é possível. Eu acho que é possível. 

Tiago Gimenes
Eu acho que seria bom também. Então a vida acontece por chat porque porque aí o Tavano consegue fazer. Porque o Tavano tem vários botezinhos. Tavano tem esses votos aqui. Nunca sei qual que é o certo mas tem esse developer né ele tem vários caras aqui talvez ele queria ter um cara que chama de brand né e tal eu 

Luciano Júnior
acho que isso é outra coisa by the way eu não acho que isso é o agente eu acho que isso é o menu É uma coisa do menu que tá faltando aqui, tipo... É que nem o Pages. Tipo... Eu tô no contexto do Pages. O Pages serve uma coisa pra mim. É... Qualquer coisa eu gostaria... Tipo, é... É uma das coisas que tá faltando mesmo. Por exemplo, quando eu abro o Future, o dxx-future, eu queria ver as pastas lá do... Que o Guilherme organizou. Eu acho que o menu deveria ser isso. Tem Grains, Competitors, Proposal. é... não sei, pode, no fundo, pode ser só uma app que faz isso, sabe? Uma app que lê o file system e cria os menus e gerencia os menus. Mas eu sinto que é mais natural ser em relação a isso, sabe? 

Tiago Gimenes
Em relação a isso o que? 

Luciano Júnior
A separação de coisas, assim, as diferentes switch agents, para mim, eu acho que não faz sentido ele existir e o menu Não, sim, mas o... 

Tiago Gimenes
Esse cara que vem na direita aqui, né? Ele eu acho que é um... Então, eu acho que é só um dito do... O developer não é o mesmo cara que mexe, que cria... O system prompt mesmo. Não é o mesmo cara que cria as páginas, entendeu? 

Luciano Júnior
Como? 

Tiago Gimenes
Tipo, o... o... o developer, que é o cara que tá vendo aqui, ele tem um system prompt e um toolset diferente do... de eventualmente de um chat aqui que você abre quando você tá vendo a lista de páginas. Faz sentido? 

Luciano Júnior
Mas você usaria ele aí? 

Tiago Gimenes
Eu não usaria o developer aqui, exato. Então, eu acho que quando você abre, clica aqui em Pages e mostra a lista de páginas, o chat, a Vue, consegue falar para o chat Consegue botar no chat, talvez? Qual é o instructions do chat? Consegue adicionar, né? Apenda aos instructions do chat. E talvez as tools. É bem parecido com o Cursor Rules. 

Luciano Júnior
Sim. 

Tiago Gimenes
É bem parecido com o Cursor Rules. Tipo, dependendo do file aqui que você está vendo, você tem aquele Cursor Rules, né? Se é TSX ou na pasta tal, aparece um cursor rule diferente aqui. 

Luciano Júnior
Exato. 

Tiago Gimenes
Exato. Eu acho que tem alguma coisa assim, do tipo... o binding de agents aqui, ele talvez esteja... ou o binding de view, sei lá. Para você declarar uma view, você tem que falar, né? A URL da view mais o system prompt dela, sei lá, que é opcional. 

Luciano Júnior
Total. Eu acho que isso vai ser muito bom, esse system prompt, porque querendo ou não, ele termina significando qual problema essa Vue resolve, tá ligado? Tipo, você é forçado a colocar esse prompt, isso é muito bom. 

Tiago Gimenes
Eu acho que tem alguma coisa assim. E aí, talvez, ele também bote um talvez seja o toolset da Vue ou só o toolset que você quer. Talvez seja o que você falou mesmo, você pega todos os tools que a Vue usa Me bota aqui no chat já, né? 

Luciano Júnior
É, sabe por quê? Porque a gente vai... Eu cheguei a isso tentando resolver os problemas nossos agora. A gente vai querer geração em run, tipo, na web de Vue. Aí existe uma constraint real, que é as permissões que você tem que rodar. Então, quando eu estou gerando o código, eu vou ser obrigado automaticamente para toda Vue ter as tool calls que ela está fazendo ali, para eu conseguir fazer o pedido de autorização. Então, eu mairo as well guardar isso, porque é uma informação muito útil. Eu sei quais tools essa Vue usa. Isso é bom para o contexto do chat, isso é bom para... Sabe o quê? Eu acho que tem um negócio aqui no desktop, que você sempre consegue remix uma Vue de outro app. Se você viu esse page do app que estava... No final, ele chama tools que você pode chamar no seu agente, está disponível para você no seu SDK. Então, você poderia fazer tipo um detect ou um clone nessa view e dizer, caramba, eu queria que as pages fossem invertidas, um negócio assim, sabe? Aí, eu acho que tendo o toolset lá, é só refazer, criar uma outra view dele com esse toolset. 

Tiago Gimenes
Esse toolset é meio que declarativo aqui? Ou você acha que é autodescrito? 

Luciano Júnior
Não, então eu acho que ele está declarativo, é um salvo, mas não precisa colocar ele porque é captor. Tipo, a gente sempre quando vai usar a Vue, criar a Vue, mantém em sync porque provavelmente foi a AI que gerou o código, então ela poderia gerar o código e gerar a lista automaticamente, sabe? Sim, mas... 

Tiago Gimenes
É, perfeito, mas você foi lá e pediu pra AI mexer em alguma coisa na sua viva, aí ela esqueceu de ir mexendo no Toolset. Aí meio que dá um Forbidden, é isso? 

Luciano Júnior
É, provavelmente vai ter algum mecanismo ali dentro da camada do RPC também que a gente pode fazer. Tá bom. É, o Forbidden eu acho que ele vai ter que trigar o Authorize em cima, um negócio assim. 

Tiago Gimenes
Mas eu concordo, pode ter alguma coisa assim, um System Prompt, tem a Vue, tem um System Prompt e um Toolset. Eu acho que é isso aí. E aí, acho que até pode ser uma parada maneira que a gente pode ter uma Vue padrão do qualquer um, qualquer MCP. você instala pelo pacman tem uma view padrão que é essa aqui ó tá ligado? é exatamente isso ah total, é o... 

Luciano Júnior
a ficha dele né, um negocinho 

Tiago Gimenes
é tipo, essa é a view padrão de qualquer mcp e aí se você quiser você pode fazer uma view melhor e 

Luciano Júnior
você tem um chat com ele do lado 

Tiago Gimenes
exato, que já vem tipo meio que... que já vem com contexto, né? Já vem nesse contexto aqui, ó. 

Luciano Júnior
Isso. Cara, isso é muito útil. 

Tiago Gimenes
Cara, eu acho que esse sistema é o sistema. Ele é bem simples e eu acho que funciona com qualquer coisa. E aí que é a grande coisa, nossa, do tipo, pô, você tem um sistema maluco Você quer adicionar AI em cima dele? Não tem problema, você faz um MCP pra conectar com ele, que você já vai ter que fazer, né? Pra botar na AI. E... Fazendo isso, você já ganha um chat. Você pode fazer agentes, que são rules, na real, né? Que é um tool só com um toolset menorzinho seu. E fazer UIs pra ficar mexendo nessas tools também, se você quiser. 

Luciano Júnior
E comprar coisas, e vender coisas. Os exemplos nossos tem que mostrar a geração de imagem. É muito bom na parada visual, assim. 

Tiago Gimenes
Então, aí, meu... Acho que esse é o sistema. Aí... Ah, como é que você faz workflows, por exemplo? Ah, você faz um MCP de workflow, que vai ter toolzinhas aqui de workflows, né? Tipo, create workflow, não sei o que lá. Aí vai ter uma lista de workflows, aí que você clica, você entra no workflow, Aí como você clica e entra no workflow, ele vai adicionando aqui no contexto, né? E... E... E, cara, eu acho que é pura... Ah, sim, aí você... Ah, você tá fazendo o workflow, você trocou a caixinha lá. 

Luciano Júnior
Eu tô vendo o... Isso tá no MCP ainda? Ou tá no desenho? Ah, vou... No MCP. Pensei que você estava mexendo no desenho. 

Tiago Gimenes
Não, não. Estou no MCP. Aí você... Você vai entrando, vai fazendo isso aí. Aí, tipo, ó, você quer... testar, pedir pra alguma coisa, assim. Aí o... Acho que é o próprio app do MCP lá, que te testa e faz as coisas. 

Luciano Júnior
Total, e a gente pode ir deixar descobrindo, né? Comportamentos e ver o que emerge. E quando emergir uma coisa muito comum, vai lá e lança um binding, né? Negócio assim. 

Tiago Gimenes
É, sim. 

Luciano Júnior
Isso é o The Ultimate Plugin System, tá ligado, Jimenez, também. As pessoas, eu acho que vão migrar, talvez, alguma plataforma pra cá, tá ligado? Wordpress, David, porque é um sistema de plugin muito bom. 

Tiago Gimenes
É, então, ele não é uma plataforma de criar agentes, É uma plataforma, cara, que você cria I.I. Você bota qualquer sistema atrás de uma I.I. 

Luciano Júnior
É tão poderoso que não tem um nome ainda pra ele. Acho que vai surgir. 

Tiago Gimenes
Por exemplo, a app de agentes. Isso é uma discussão que eu tinha com o Candê, que a gente não chegou em alguma coisa feita ainda. Mas eu acho que essa app de agentes aqui, Ela é uma app também feita em cima, mas ela é só uma app de CMS de agentes que você cria aqui. 

Luciano Júnior
Construção de software, né? Construção de software com JSON. 

Tiago Gimenes
É, uma AI de construção de agentes. Ah, então é GPT, que o pessoal fala. Então a gente tem essas features aqui, mas a app deu feature. Tipo, eu não acho que você vai fazer um agente num MCPC e ele vai aparecer aqui nessa lista. O developer, esse developer né, que o Tavano fez, eu não acho que aparece nessa lista aqui. Eu acho que o developer, ele é só um system prompt que aparece nesse arroba aqui. 

Luciano Júnior
E ele fez onde o developer? 

Tiago Gimenes
Ele fez no binding aqui. 

Luciano Júnior
Entendi, pode ser. 

Tiago Gimenes
Pode ser que seja tipo um arquivo, pode referenciar o arquivo, não precisa ser online. Pode ser um arquivo que ele importe, exporta e tal. Mas eu acho que ele é com recurso rule. 

Luciano Júnior
Mas eu acho que eu tenho a impressão que a criação de agente vai verticalizar. Eu acho que, tipo, os melhores criadores de agentes são os seus que são criadores de agentes para casos de uso mais específicos. Aí eles usam melhor daqueles conceitos lá de work memo, desse negócio. Porque, tipo, sempre tem uma parada de que Acho que as melhores coisas da gente é atendimento humano. Atendimento humano, cara, a gente quase 90% dos casos é um N1 e em algum momento você vai querer passar por humano ou pelo menos no início da operação quando algo der aí vai ter que ser um software de cms de agente que ele é todo aqui parado para isso sabe para fazer o agente conectar no whatsapp mas ver as conversas de uma pessoa usar é eu vejo caminhando por aí esse mundo de construção de agentes que eu acho que vai ser legal e tá 

Tiago Gimenes
mas aí e é isso aí é 

Luciano Júnior
só deixar surgir ainda não é bom Mas eu sinto que o papel de playground já fica resolvido nesse negócio de ter o chat na direita porque aí acho que você vai estar explorando a App Store aí vendo lá um MCP do de geração de imagem geração de vídeo aí você pede para mexer nele tá ligado não precisa criar aí quando você for realmente criar um agente é É bom ter um criador de agentes assim. Mas... Eu acho que o Coding Agent vai direcionar a pessoa para o lugar certo. Ele vai dizer o que a pessoa quer criar, tá ligado? Esse agent tem que ter capacidade de se redirecionar ativas também dentro desse sistema. 

Tiago Gimenes
A capacidade de quê? Redirecionar? Como assim? 

Luciano Júnior
O bom seria que se ele descobrir que você precisa ir pra outro lugar, ele manda você pra lá, tá ligado? Aí envolve se meter um pouco mais no que a Viu faz, no exemplo que é um SPA de pages, e quando clica, page vai pra page, teria que informar isso, não sei. Mas vale considerar. Sim. 

Tiago Gimenes
Isso, e tipo, eu acho que você tem esse prompt da Vue, mas se você cria um agente dentro dessa lista de Agents aqui, o próprio MCP do Agents vai crescer no número deles e eles ficam disponíveis no seu workspace. 

Luciano Júnior
Legal, ele tem um Dynamic Tools. O ListTool deles lá é uma função que ele faz um busca no banco. 

Tiago Gimenes
Não sei se é ListTool, mas talvez ele tenha um bind. 

Luciano Júnior
Ah, sim, então tá. Ele tem um ListAgent aí, né? 

Tiago Gimenes
ListAgent e RunAgent com uma message. 

Luciano Júnior
É, quando você falou crescer, eu imaginei o MCP crescendo. Porque isso aí é crescendo só no sentido de que é um parâmetro ou é uma tool, né? 

Tiago Gimenes
Ah, eu posso fazer uma outra app? no meu workspace, que depende das apps do meu workspace, né? Acho que isso aí é ok. E até fazer as views, né? Se for fazer uma view nova, eu quero depender de Agents Workflows, né? Então, eu dependo dessas duas apps, de Agents Workflows, só do meu workspace, e uso um Agents Workflows específico delas. 

Luciano Júnior
Exato. Vai ser bem útil isso, inclusive, eu acho. 

Tiago Gimenes
É, porque eu vou fazer prompts também, né? Então, a app de prompts... 

Luciano Júnior
É, prompts eu acho que não existe. Eu acho que deveria ser um sistema de notas, que tem a ver com notebook, tem a ver com reflect, e é isso, e tudo é prompt, tá ligado? Pode ser. 

Tiago Gimenes
Mas... Exato, pode ser, é que um outro sistema... 

Luciano Júnior
É o notepad, tá ligado? 

Tiago Gimenes
Notepad, é. Pode ser, pode ser. Pode ser. E aí, tipo, tem essa app de agency que vai escrevendo coisas no meu workspace. Tem essa app de repouso que vai escrevendo coisas no meu workspace. 

Luciano Júnior
E como que tá a questão do file system aí, que ele não surgiu? 

Tiago Gimenes
Não, ele surgiu. Eu acho que ele tá nesse aqui, ó, nesse store no Decofig. Só que ele é uma coisa, ele não é uma... Eu acho que ele é uma API e lib dos SEO. 

Luciano Júnior
Mas o desktop aproveita disso e faz as paradas de publish, de diff ali no botãozinho em cima, como é que tá isso, ponto? 

Tiago Gimenes
Então, essa é a parada, essa é a parada. Eu estudo que... Ah, eu não sei se isso é uma coisa do DecoCMS, ou não, eu acho que é, tá, pode ser, eu acho que é bem justo que seja. 

Luciano Júnior
Não tem problema não, porque você pode sempre resolver, né, invertendo a dependência, criando um sistema de plugins que coloca lá, aí uma app super específica vai lá e injeta o negócio que você faz. 

Tiago Gimenes
É, top bar, né? 

Luciano Júnior
É. 

Tiago Gimenes
Vai ser uma top bar aqui. É, eu não sei, eu talvez botaria por não precisa criar mais outra app ou um sistema de coisa que... 

Luciano Júnior
Eu acho que é bom, eu acho que isso é bom. 

Tiago Gimenes
É, eu acho que eu botaria sim. Pode ser, pode ser que a gente bote. É... Mas é isso, então o nosso sistema, ele é meio que, ele é um mesh de MCPs que, se esse MCP Se não tiver nada, se ele não tiver nenhum bind de view, ele pega aquela view padrão, nossa, que é essa aqui. E é isso, e aí você consegue falar com qualquer MCP do mundo, tá bom? Consegue abrir o Google Sheets. E aí você pode fechar e tal, sei lá, abrir, deixar maior ou menor. Se você tiver alguns bindings mais diferentes, você consegue botar uma view aqui, por exemplo. Que referencia algumas rules, que falam como você fala com aquela view que tá ali. é de algumas turmas. 

Luciano Júnior
Uma coisa que me faz ver o. acho o Cosmos resolvendo tudo e automático é que os descriptions delas são muito bons eu acho que tem super espaço para ela ser tipo eu não acho que existe System Prompt tá ligado não deveria existir eu acho que você abstrai no AnTu que tem os parâmetros pode ter um texto lá dentro tá ligado explicando como faz a coisa E o prompt sempre é o que a pessoa pede, e as tools têm muita informação lá dentro, e talvez informação crescente. É normal, ao longo do seu uso, você ir colocando mais informações nas tools, tá ligado? Ou criando tool nova, tipo, tem o Run SQL, né? Isso é um caso de uso, inclusive, que eu acho que é muito bom contemplar. Eu criei uma tabela, eu sei o esquema da tabela, eu queria que automaticamente já tivesse um criar, atividade, listar atividade, editar atividade, que isso é mais ou menos isso. É você dar mais informação, dar mais prompt, criando uma tool e dizendo que cada campo é não sei o que. Tipo, é quase Poderia ter o mesmo efeito de você ter um prompt salvo ali, que é o esquema da sua tabela de atividades, e como é que chama. Aí, quando a pessoa for chamada, que há duas semanas, ela teria que lembrar de marcar esse prompt. Ou você cria as tools que abstraem aquilo de uma forma mais ideal, tá ligado? Pode ser. 

Tiago Gimenes
Pode ser. É porque, então, às vezes... Às vezes você falar a ordem que as tuas devem ser chamadas pode tá nas tuas também né mas pode 

Luciano Júnior
não eu acho que tem muito espaço para isso mas aí é espaço do seu contexto e eu acho que é mais é melhor representada com um file system de markdowns que são seus documentos que é o future lá tá ligado na dev aí tem umas pastinhas com maquia o prompt hoje é exatamente o prontos e 

Tiago Gimenes
aí Pode ter uma outra appzinha que só serve para listar o file system Depois 

Luciano Júnior
que a gente fez isso Então, aí uma parada que é importante. Eu queria saber onde é que você está sobre isso. Droga, perdi. O real time, porque eu acho que uma parada muito foda disso é eu tá no DecoPilot e vê as coisas mudando, né? Tipo, eu edito o workflow, eu edito a section ali, muda na hora, eu vejo, eu edito o tema do workspace, do desktop e troca. Isso é tudo powered pelo ConfigState? É... 

Tiago Gimenes
Cara, eu acho que, pensando pelos agentes, acho que se você mexe ele no agente e tal, e ele mexe na hora, é por causa que o config state mudou também, e a gente tá usando aquilo lá com um banco de dados. E acho que tudo que, tipo, guardar um arquivo e a hora que for executar ele, pegar o arquivo e executar, acho que vai tudo funcionar. 

Luciano Júnior
em ler, meio que sempre ler com o watch, né? E aí quando a outra parte do sistema troca, ele atualiza também. 

Tiago Gimenes
Eu até tava querendo fazer um cara de... eu queria fazer um cara que cria tools baseadas MCPs que já existem, que você já instalou e fez alguma coisa. 

Luciano Júnior
Mas tipo, teve um post que eu vi uma vez que era tipo uma matriz assim, cruzando, tá ligado? De drogas que você usa e tipo, qual que era o efeito, sabe? Combinar essa com essa, com essa, com essa. Teve que fazer isso com os MCPs, né? 

Tiago Gimenes
Uma matriz de confusão. E cara, eu acho que é... É, eu acho que é tipo uma app que baixa os... Tipo, eu acho que você escreve um código. Aí, tudo que for ler um arquivo de configuração para executar, e aí executar alguma coisa, a gente consegue fazer. Multi-tenente. Então a gente consegue fazer, tipo, sei lá, Escrever um arquivinho, que é o arquivinho da tool, que seja a name, description, não sei o que lá, e exportar a função. A gente consegue fazer uma app multistand que sempre pega aquilo lá e executa. Eu estava pensando em fazer isso com essa capability aqui do sistema que é muito importante de execution sandbox. A app pode não ter nada, mas ela tem o sandbox dado pelo iOS, então ela pode sempre pegar, executar no sandbox, pegar o resultado e voltar. 

Luciano Júnior
Legal. Que é o que vamos integrar no notebook aqui, né? 

Tiago Gimenes
Que é o que a gente vai integrar no notebook eventualmente. O notebook pra mim é uma app. 

Luciano Júnior
Ok. Porque no final ele é lido em JSON também. A única coisa que eu quero é que ele tenha um chat que mexe nele. É. Olha como tá ficando. Cara, foi melhor do que eu imaginava em quantos fixos precisei fazer. O que é que foi que eu fiz? Eu comecei a fazer esse plano aqui, ó. Aí eu acho que eu passei uns 20 minutos editando, umas 6 vezes editando o plano. Então eu fui lá desde o início, aí fui dizendo, é... quero isso. Aí falei... Eu quero que as tools available sejam essas, de exemplo. Eu tô focando mais em fazer a POC. O input e output deveria ser um Zó de esquema. Aí foi, foi, foi, foi, foi, foi, foi, foi, foi, foi, foi, depois eu mostro. Aí ele fez isso aqui, ó. É... Calma. Ó. Ainda tá meio confuso. Vamos ver se vai funcionar. Eu tenho esses blocos que eu posso adicionar um markdown ou um bloco de código. Eu acho que deveria adicionar um bloco de código. Mas o markdown eu posso usar para fazer markdown. Aí eu vou lá e coloco um preview. Mas eu posso também pedir uma parada aqui e dizer código para hello world. Aí eu dou comand and enter. ele processa esse bloco e ele faz um generate object de adicionar um bloco de código. E no bloco de código aqui, eu posso rodar. Aí ele vai lá e faz um hello world. O legal é que com assim, essa é a parte das nuances, né? É que eu ensinei a ele como é que chama tool. O ListTools não tá bom ainda, ele não lista as tools de fato que tem. Fica nua o device. Mas eu coloquei uma de tools lá. Aí, por exemplo, tem uma tool de SQL. Eu posso dizer aqui, faça um fetch da tabela articles e dê um alerta de quantos tem. Aí, o prompt desse negócio que gera bloco, ele tem mais ou menos como é que faz o .env, e as tuas disponíveis. Aí ele foi lá e fez um await env runCycle. Aí eu vou lá, o rodar desse código aqui, ele é... executar o código. Aí deu quantidade de artigos zero. Não sei se foi esse mesmo o resultado, mas aqui ele... 

Tiago Gimenes
Ah, ele chamou o negócio. Você implementou um .env aí no browser. 

Luciano Júnior
Implementei. Aí ele vai e faz a Tupal aqui, ó. é aí voltou na verdade é porque ele não soube ele não soube ver o tipo da resposta que é o que eu não eu não eu não coloquei mas eu vou colocar o Zodisquina para ele ter acesso mas ó fez lá o Fetch tá ligado no banco aí eu acho que isso é com agente só que com interface que você vai executando as coisas e vai criando E aí o que eu preciso fazer é a parte de preview desses códigos aqui, mostrar o resultado, mostrar uma view. E cara, eu acho que com a gente aqui para fazer essa parada, isso é muito poderoso. Estou satisfeito aqui com o resultado. Vai ser uma junção poderosa isso. 

Tiago Gimenes
É, exato. É isso aí. 

Luciano Júnior
Agora é só pegar o transcript aqui, gerar o prompt e pedir. Aí você tá pensando em fazer o que primeiro? 

Tiago Gimenes
Cara, você tá mais ou menos de acordo com isso aí, com o overall, né? 

Luciano Júnior
100%. Eu vou... 

Tiago Gimenes
eu tenho esse meu documento lá, Estou querendo mexer nele para encaixar esse mundo lá nele. Ele fala a posição atual do que eu quero fazer. E começar a fazer isso para fazer isso direito. Talvez uma das coisas que eu posso começar a fazer. eu tenho esse meu documento lá, Estou querendo mexer nele para encaixar esse mundo lá nele. Ele fala a posição atual do que eu quero fazer. E começar a fazer isso para fazer isso direito. Talvez uma das coisas que eu posso começar a fazer.