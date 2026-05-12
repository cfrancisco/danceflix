#TODO LIST

OK > Vamos amadurecer a parte de videos (VideoSource), talvez ele precise ter um id unico. Em seguida, podemos ter uma nova pagina com o CRUD para gerenciar esses videos, com uma listagem de videos, onde cada video tem um titulo, uma descrição, um link do youtube ou um arquivo local
OK > Tem uma lista de passos de dança que aparecem naquele video, com os timestamps de início e fim de cada passo, ao mesmo tempo, pode não ser necessario ter passos de danças já relacionados a ele. 
OK > De forma similar, na edição de passos (por exemplo http://localhost:5173/danceflix/#/video/deslize), deve ser possivel fazer o upload de um video (ou vincular um já existente), dessa forma, já deve vincular a aquele video a este passo também.  
OK > Vale citar que um passo pode estar presente em mais de um video, e um video pode ter mais de um passo, então é uma relação muitos para muitos.
OK > Na edição de flow, onde fazemos a construção dinâmica do flow, podemos vincular os passos de dança que estão ali com os timestamps do video?

OK > No flow maps, na visualização pelo mapa Mental: Os numeros dos steps no flow, no mapa mental, estão estourando a caixa dos numeros, pode por uma bolinha por cada numero?


----

## 08/05

OK > Ao abrir a pagina de um video, eu quero conseguir Ver o timestamp inicial e final que cada passo aparece no video, que já devem estar salvos na entidade do video, para que quando eu clicar no play, ele já comece naquele timestamp e termine no timestamp final. 
OK > Eu devo poder editar esses timestamps, para corrigir caso estejam errados. Quando for dado play nesse video, em um determinado passo, ele deve ser mostrado no timestamp reference a aquele passo e terminar quando acabar o timestamp, tendo um botão para voltar ao timestamp que aquele passo começa. 

OK > Gostaria de uma feature simples de importação e exportação, que ele me tirasse as informações que atualizei no localstorage, e me entregasse como .json para atualizar na base de dados do projeto. 

OK > Vamos primeiro atualizar a entidade do flow, para ter um campo de video, que pode ser um link do youtube ou um arquivo local, e um array de objetos, que tem timestamps e passos de danças (cada objeto tem o id do passo, o timestamp inicial e o timestamp final). Depois, na parte de edição do flow, vamos ter um campo para colocar o link do video, e uma forma bem visual para vincular um passo que já está ali, com uma tupla de timestamps.


----

## 09/05

OK > Permitir upload de video;
OK > Atualizar a lista de features no README, para ficar mais claro o que tem no projeto, e o que falta ser feito.
OK > Remoção do agrumento de passos por categoria, para facilitar a visualização de quais passos estão relacionados a cada elemento do flow.
OK > Fazer trocar dinamicamente a ordem dos passos.
OK > Permitir adicionar um video já existente a um passo. 

OK > Permitir editar dados de passos e de videos já estão na base de dados do projeto (e serem salvos em localstorage),  e depois exportar esses dados em um arquivo .json, para depois atualizar a base de dados do projeto. 
OK > Adicionar também um botão para exportar essas mudanças feitas. 
OK > Para facilitar provavelmente a base de dados do projeto precisa ser atualizada para usar .json ao invés de .ts, para facilitar a exportação e importação dos dados, por exemplo: data/styles/zouk/steps.json, data/videos/videos.json, etc.
 
----------

10/05/2026

OK > Na edição de flow, onde fazemos a construção dinâmica do flow, podemos ter uma parte onde colocamos o link do video, podemos também buscar os videos que estão cadastrados
OK > Na tela do CRUD de Vídeos,  gostaria de conseguir exportar o JSON com as informações do local storage + as default, para conseguir ter uma versão atualizada para trocar na base de dados.

OK : Na nossa feature de Edição de flow, ela está muito boa, mas a diagramação em tela está muito confusa, não tem uma hierarquia visual clara.  Pensei em não mostrarmos mais os flows em baixo, quando clicar em um flow na listagem no sidebar, ele abre as informações naquele sidebar mesmo, com as opções de voltar (back) e de editar o flow. 
OK > Ao editar o flow, podemos ter as mesmas opções que tinhamos antes no container que fica no footer, mas agora nesse sidebar. Assim acredito que poluimos menos a tela, fique a vontade para mudar da forma que escolher também.
OK > Ao editar flow, a diagramação dos elementos em tela estarem mais claros.

OK > No flow maps, na visualização pela lista de videos: Eu quero conseguir assistir os videos rapidamente, igual ao tooltip que está no mapa mental (pode até ser o mesmo componente). Hoje o tooltip está lá, mas eu passo o mouse em cima e ele some, sem que eu consiga dar play.

OK > Queria fazer o código do projeto, ao fazer upload de um video, aceitar também shorts de youtube, que tem um formato diferente de link. Além disso, talvez precise de outro loader para ele ou não?

OK > Refatoração: Gostei do trabalho de isolar o CSS do arquivo FlowMapGraph, podemos fazer isso também para as outras paginas e componentes do projeto? Tirar os styles do className e fazer classes separadas e organizadas, para facilitar manutenção e leitura do código. O que conseguir fazer global ou reaproveitavel, seria melhor ainda. 

----------------- 

Para depois:
- Rever flows;
- Rever dificuldades;
- Rever videos dos passos;
- Rever descrições;
- Rever tags;
- Procurar shorts do youtube sobre zouk;


