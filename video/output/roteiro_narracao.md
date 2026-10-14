# Roteiro de narração — montagem do perceptron na protoboard

Gerado automaticamente a partir de `src/scene.js`. Os tempos batem com o vídeo `montagem_protoboard.mp4`;
leia cada fala dentro da janela indicada para gravar a narração por cima do vídeo.

Duração total: **9:07**


## Perceptron físico na protoboard

**0:00–0:09**

> Neste vídeo, vamos montar na protoboard o perceptron que implementa a função AND — passo a passo, furo por furo.


## VISÃO GERAL · O que vamos montar

**0:09–0:19**

> O treinamento acontece no R. O circuito apenas executa a regra aprendida: os pesos viram resistores e o viés vira uma tensão de referência.

**0:19–0:35**

> Com w1 = w2 = 2 e b = −3, usamos R1 = R2 = 10 kΩ, R0 = 4,7 kΩ e um limiar de cerca de 1,8 V. O LED acende só quando x1 = x2 = 1.


## VISÃO GERAL · Material

**0:35–0:46**

> Separe o material: protoboard, fonte regulada de 5 V, LM358, duas chaves, potenciômetro de 10 kΩ, resistores, LED, capacitor de 100 nF, jumpers e multímetro.

**0:46–0:54**

> Identifique os resistores pelas cores: 10 kΩ é marrom-preto-laranja, 4,7 kΩ é amarelo-violeta-vermelho e 1 kΩ é marrom-preto-vermelho.


## ANTES DE COMEÇAR · Conhecendo a protoboard

**0:54–1:05** · _Na tela:_ Cada coluna tem dois grupos de 5 furos ligados: a–e e f–j

> Na protoboard, os cinco furos de uma mesma coluna numerada estão ligados entre si: a–e na metade de cima e f–j na metade de baixo.

**1:05–1:17** · _Na tela:_ O canal central isola as duas metades

> O canal central separa as duas metades. É sobre ele que o chip será encaixado, para que os pinos de um lado não encostem nos do outro.

**1:17–1:28** · _Na tela:_ Trilhas: + (linha vermelha) e − (linha azul)

> As trilhas das bordas levam a alimentação. Neste vídeo, a trilha de fora é +5 V (linha vermelha) e a de dentro é GND (linha azul).

**1:28–1:39** · _Na tela:_ Trilha interrompida no meio? Una com um jumper

> Confira as marcas da sua protoboard. Em alguns modelos, as trilhas são interrompidas no meio: nesse caso, una as duas metades com um jumper.


## PASSO 1 DE 8 · Alimentação da protoboard

**1:39–1:52** · _Na tela:_ Fonte desligada: + na trilha + e GND na trilha − (em cima)

> Passo 1: com a fonte desligada, ligue o positivo de 5 V à trilha + de cima e o GND à trilha − de cima. Ela só será ligada no final.

**1:52–2:05** · _Na tela:_ Pontes na direita: + com + (col. 30) e − com − (col. 29)

> Leve +5 V e GND também às trilhas de baixo com dois jumpers na ponta direita: o vermelho liga + com +, e o preto liga − com −.


## PASSO 2 DE 8 · Posicionar o LM358

**2:05–2:17** · _Na tela:_ Ache a meia-lua: o pino 1 fica ao lado dela

> Passo 2: pegue o LM358 e encontre a meia-lua (ou o pontinho) no corpo do chip. Ela marca o pino 1, e a contagem segue no sentido anti-horário.

**2:17–2:31** · _Na tela:_ Chip sobre o canal, colunas 15 a 18, meia-lua à esquerda

> Encaixe o chip sobre o canal central, nas colunas 15 a 18, com a meia-lua para a esquerda. Os pinos 1 a 4 ficam embaixo e os pinos 8 a 5, em cima.

**2:31–2:44** · _Na tela:_ Usaremos o amplificador A: pinos 1, 2 e 3

> Vamos usar o primeiro amplificador: o pino 3 recebe a soma VS, o pino 2 recebe o limiar Vref e o pino 1 é a saída que acende o LED.


## PASSO 3 DE 8 · Alimentar o LM358

**2:44–2:54** · _Na tela:_ Pino 8 → +5 V: jumper a15 → trilha +

> Passo 3: ligue o pino 8 ao +5 V com um jumper vermelho, do furo a15 até a trilha + de cima.

**2:54–3:02** · _Na tela:_ Pino 4 → GND: jumper j18 → trilha −

> Ligue o pino 4 ao GND com um jumper preto, do furo j18 até a trilha − de baixo.

**3:02–3:16** · _Na tela:_ Capacitor 100 nF entre + e −, ao lado do chip

> Coloque o capacitor de 100 nF entre +5 V e GND, bem ao lado do chip. É o mesmo que ligá-lo entre os pinos 8 e 4, e ele estabiliza a alimentação.


## PASSO 4 DE 8 · Segundo amplificador

**3:16–3:28** · _Na tela:_ Pino 5 → GND: jumper a18 → trilha −

> Passo 4: o segundo amplificador não será usado, mas não pode ficar com as entradas soltas. Ligue o pino 5 ao GND: jumper de a18 até a trilha −.

**3:28–3:40** · _Na tela:_ Pino 6 ↔ pino 7: jumper c16 → c17

> Agora ligue o pino 6 ao pino 7 com um jumper curto, de c16 a c17. Assim o segundo amplificador fica quieto, como um seguidor de 0 V.


## PASSO 5 DE 8 · Chaves de entrada

**3:40–3:53** · _Na tela:_ Chave x1 em g1, g2, g3 (comum = g2)

> Passo 5: encaixe a chave da entrada x1 nos furos g1, g2 e g3. O terminal do meio, g2, é o comum: é ele que vai para o resistor.

**3:53–4:08** · _Na tela:_ j1 → +5 V e j3 → GND

> Ligue um terminal lateral ao +5 V (jumper de j1 até a trilha +) e o outro ao GND (de j3 até a trilha −). A chave escolhe entre 0 V e 5 V.

**4:08–4:19** · _Na tela:_ Chave x2 em g8, g9, g10; j8 → +5 V e j10 → GND

> Repita para a entrada x2: chave em g8, g9 e g10, jumper de j8 até o +5 V e de j10 até o GND.

**4:19–4:31** · _Na tela:_ Confira o comum com o multímetro

> Atenção: confira com o multímetro qual terminal é o comum da sua chave, pois a posição da alavanca não garante isso. E nunca ligue +5 V direto no GND.


## PASSO 6 DE 8 · Nó de soma

**4:31–4:42** · _Na tela:_ R1 (10 kΩ): f2 → f5

> Passo 6: a coluna 5 será o nó de soma, VS. Ligue R1, de 10 kΩ, do furo f2 (comum da chave x1) até f5.

**4:42–4:49** · _Na tela:_ R2 (10 kΩ): i9 → i5

> Ligue R2, também de 10 kΩ, do furo i9 (comum da chave x2) até i5.

**4:49–5:01** · _Na tela:_ R0 (4,7 kΩ): j5 → trilha −

> Ligue R0, de 4,7 kΩ, do furo j5 até a trilha GND. Ele puxa o nó para 0 V quando as duas chaves estão em 0.

**5:01–5:09** · _Na tela:_ VS → pino 3: jumper h5 → h17

> Por fim, leve VS ao pino 3 do LM358 com um jumper amarelo, do furo h5 até h17.


## PASSO 7 DE 8 · Limiar com o potenciômetro

**5:09–5:20** · _Na tela:_ Potenciômetro em f11, f12, f13 (cursor = f12)

> Passo 7: o potenciômetro de 10 kΩ gera o limiar. Encaixe-o nos furos f11, f12 e f13. O terminal do meio, f12, é o cursor.

**5:20–5:31** · _Na tela:_ j11 → +5 V e j13 → GND

> Ligue um terminal externo ao +5 V (jumper de j11 até a trilha +) e o outro ao GND (de j13 até a trilha −).

**5:31–5:43** · _Na tela:_ Cursor → pino 2: jumper i12 → i16

> Leve o cursor ao pino 2 do LM358 com um jumper verde, do furo i12 até i16. Girando o potenciômetro, Vref varia entre 0 e 5 V.


## PASSO 8 DE 8 · Saída e LED

**5:43–5:52** · _Na tela:_ Pino 1 → coluna 21: jumper g15 → g21

> Passo 8: leve a saída, o pino 1, para a direita com um jumper laranja, do furo g15 até g21.

**5:52–6:01** · _Na tela:_ Resistor 1 kΩ: h21 → h25

> Coloque o resistor de 1 kΩ de h21 até h25. Ele limita a corrente do LED e nunca deve ser retirado.

**6:01–6:11** · _Na tela:_ LED: perna longa em g25, perna curta em g26

> O LED tem polaridade: a perna longa (ânodo) vai em g25, junto do resistor; a perna curta (cátodo, lado chato) vai em g26.

**6:11–6:21** · _Na tela:_ Cátodo → GND: jumper j26 → trilha −

> Feche o circuito ligando a coluna 26 ao GND, com um jumper preto de j26 até a trilha −. A montagem está completa!


## ANTES DE LIGAR · Revisão

**6:21–6:33**

> Antes de ligar, revise: meia-lua para a esquerda, pino 8 no +5 V, pino 4 no GND e nenhum fio ligando +5 V direto ao GND.

**6:33–6:44**

> Confira também: VS no pino 3, Vref no pino 2, LED com a perna longa do lado do resistor e todas as partes no mesmo GND.


## TESTE · Ligar e calibrar

**6:44–6:55** · _Na tela:_ Ligue a fonte e meça entre + e −: cerca de 5 V

> Tudo certo? Ligue a fonte. Com o multímetro em tensão contínua, meça entre as trilhas + e −: o valor deve ficar perto de 5 V.

**6:55–7:09** · _Na tela:_ Meça o cursor (g12) e ajuste para cerca de 1,8 V

> Agora meça o cursor do potenciômetro (furo g12) em relação ao GND e gire até cerca de 1,8 V. Esse é o limiar da função AND.


## TESTE · Função AND

**7:09–7:20**

> Teste as quatro combinações medindo VS na coluna 5. Com x1 = 0 e x2 = 0, VS = 0 V, abaixo do limiar: LED apagado.

**7:20–7:28**

> x1 = 0 e x2 = 1: VS ≈ 1,21 V, ainda abaixo de 1,8 V. LED apagado.

**7:28–7:36**

> x1 = 1 e x2 = 0: o mesmo valor, cerca de 1,21 V. LED apagado.

**7:36–7:46**

> x1 = 1 e x2 = 1: VS ≈ 2,42 V, acima do limiar. O LED acende — o circuito implementa a função AND!

**7:46–8:00**

> Com R0 = 4,7 kΩ, as tensões ficam um pouco abaixo das teóricas com 5 kΩ (1,25 V e 2,50 V). Vale o que você medir: anote tudo na folha de registro.


## DIAGNÓSTICO · Se algo der errado

**8:00–8:11**

> LED nunca acende? Confira a polaridade do LED, a alimentação do LM358 (pinos 8 e 4), o resistor de 1 kΩ e a tensão de referência.

**8:11–8:22**

> LED sempre aceso? Meça VS e Vref: o limiar pode estar baixo demais, ou os fios dos pinos 2 e 3 podem estar trocados.

**8:22–8:32**

> As chaves não mudam nada? Verifique o comum das chaves e o GND comum. O LED pisca? Afaste Vref das tensões medidas.


## BÔNUS · O mesmo circuito faz OR

**8:32–8:43** · _Na tela:_ Gire o cursor até cerca de 0,6 V

> Bônus: gire o potenciômetro até cerca de 0,6 V. Sem trocar nenhuma peça, o mesmo circuito passa a implementar a função OR.

**8:43–8:56** · _Na tela:_ Teste: 00 apagado; 01, 10 e 11 acesos

> Agora o LED acende em 01, 10 e 11, e só fica apagado em 00. Quem decide a regra lógica é o limiar.


## Resumo

**8:56–9:07**

> Resumo: dados rotulados → treino em R → pesos e viés → resistores e limiar → classificação física. Bom experimento!

