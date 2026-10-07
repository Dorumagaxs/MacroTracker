# v0.1.5
- Features:
    - Base de dados padrão ampliada para 300 alimentos, incluindo alguns industrializados
    - Implementada a leitura de barra de códigos, com conexão à API Open Food Facts
    - Botão de registro de alimentos e água trocado para um floating button

# v0.1.4
- Features:
    - Barra vermelha de sobreposição quando a meta diária for ultrapassada
    - Botão x em todos os inputs para limpar o campo
    - Na criação de alimento, mudança da porção para 1 quando selecionada a unidade de medida "unidade"
    - Na criação de alimento, mudança da porção para 100 quando selecionada a unidade de medida "gramas" ou "mililitros"
    - Populado a Base de Dados com os 200 alimentos mais consumidos no Brasil, utilizando sempre que possível os valores da TACO

# v0.1.2
- Fixes:
    - Excluídos os dias sem registro do cálculo da média semanal e mensal na aba Histórico
    - Total de calorias e macros sempre arredondado para 1 casa decimal
- Features:
    - Substituídos os popups nativos pelos da biblioteca SweetAlert2
    - Água sempre mostrada como primeira refeição
    - Mostrar kcal e macros total das Refeições
    - Autocomplete adicionado à seleção de Refeição na aba Diário
    - Cálculo automático da meta de kcal a partir das macros definidas na aba Ajustes > Metas Nutricionais
    - Opção de exportação unicamente do Catálogo, sem histórico do Diário