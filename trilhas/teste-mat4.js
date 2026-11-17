// Teste do módulo mat4 (estatística, contagem e probabilidade): [enunciado, alternativas, índice da certa, explicação].
window.TESTES_MM = window.TESTES_MM || {};
window.TESTES_MM['mat4'] = [
  ["Qual é a média de 5, 7, 9 e 3?",["6","5","7"],0,"Soma 24, dividida por 4 valores: 6."],
  ["Qual é a mediana de 8, 2, 5, 9 e 1?",["5","8","2"],0,"Em ordem: 1, 2, 5, 8, 9. O do meio é 5."],
  ["Nota 6 com peso 1 e nota 8 com peso 3. Qual é a média ponderada?",["7,5","7","14"],0,"(6 × 1 + 8 × 3) ÷ (1 + 3) = 30 ÷ 4 = 7,5."],
  ["As vendas foram: janeiro 50, fevereiro 80, março 70, abril 95. Entre quais meses houve o maior aumento?",["Janeiro e fevereiro","Março e abril","Fevereiro e março"],0,"Jan → fev: +30. Fev → mar: −10. Mar → abr: +25. O maior aumento foi de janeiro para fevereiro."],
  ["Uma senha tem 3 dígitos, de 0 a 9, e pode repetir dígito. Quantas senhas diferentes existem?",["1 000","720","30"],0,"Cada dígito tem 10 opções e pode repetir: 10 × 10 × 10 = 1 000."],
  ["As 6 titulares de um time de vôlei vão ser distribuídas nas 6 posições da quadra, uma em cada. De quantas formas isso pode ser feito?",["720","36","6"],0,"Fila de 6 pessoas em 6 lugares: 6! = 6 × 5 × 4 × 3 × 2 × 1 = 720."],
  ["Uma comissão de 2 alunos vai ser escolhida entre 6 candidatos. Quantas comissões diferentes são possíveis?",["15","30","12"],0,"Comissão não tem ordem: 6 × 5 = 30 pares com ordem; cada dupla foi contada 2 vezes: 30 ÷ 2 = 15."],
  ["Jogando dois dados, qual a probabilidade de a soma ser 7?",["1/6","1/12","7/36"],0,"São 6 resultados com soma 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1) em 36 possíveis: 6/36 = 1/6."],
  ["Uma moeda é lançada 3 vezes. Qual a chance de sair pelo menos uma cara?",["7/8","1/2","3/8"],0,"Pelo contrário: nenhuma cara (três coroas) tem chance 1/8. Pelo menos uma cara: 1 − 1/8 = 7/8."],
  ["Numa sala com 12 meninos e 18 meninas, sorteia-se um estudante. Sabendo que foi uma menina, qual a chance de ser uma das 6 meninas que jogam vôlei?",["1/3","1/5","6/30"],0,"Condicional: os casos possíveis agora são só as 18 meninas. 6/18 = 1/3."]
];
