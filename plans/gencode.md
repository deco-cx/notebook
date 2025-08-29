Há uma parte importante desse sistema para fecharmos: as chamadas de javascript devem sempre voltar um valor de resposta, que devemos capturar para adicionar no cell (e utilizar desse valor)

Hoje em dia, acho que não estamos capturando isso. Preciso que você complemente esse documento apos estudar o ssitema, o estado atual, e como fazemos essa implementacao 

Isso é útil, por exemplo, para trabalhos continuos onde um dado depende do outro 

Para isso funcionar, vamos precisar que, quando um step é um código javascript, o valor retornado quando ele é executado seja capturado e salvo dentro da cell

Também é importante, junto a isso, pensarmos em como vai funcionar o sistema de variaveis e como isso vai ser usado pra AI

Um conceito importante desse sistema é a captura do schema de dados retornado e esse valor também é guardado dentro do output do step. E, por padrão, esse é o valor que é usado para enviar a AI

variavel -> schema de dados desse dado

+

instrucao de como fazer código que le essa variavel.

acho que a gente pode fazer algo como env.getVariable("variableName"). Parece bom.

Precisamos, então, também fazer essa engine funcionar 

Opcional