Feature: Economics CSV Export
    CSV exports can be opened from scenario page / economics, on the toolbar

    Rule: 2 menus, custom pdf on
        show custom pdf editor, there will be only 2 menus, 1 for csv and 1 for pdf
        Background: Open economics page with default launchdarkly flags
            # https://app.launchdarkly.com/default/test/features/roll-out-custom-pdf-generation
            # https://app.launchdarkly.com/default/test/features/roll-out-economics-export-menu-items-variation
            Given Launchdarkly Feature Flag "roll-out-custom-pdf-generation" is set to "true"                           
            And Launchdarkly Feature Flag "roll-out-economics-export-menu-items-variation" is set to "old-and-defaults" 
            And Economics page is open

        Scenario Outline: Exporting CSV <export-option>
            When CSV Export button is clicked
            And <export-option> option is clicked
            And Save button is clicked
            Then A file matching cc suggested template for <export-option> should be exported

            Examples:
                | export-option                     |
                | Core Headers                      |
                | By Well                           |
                | Aggregate Monthly                 |
                | Well Oneline Cash Flow (CSV)      |
                | Well Monthly Cash Flow (CSV)      |
                | Well Yearly Cash Flow (CSV)       |
                | Well Carbon Report (CSV)          |
                | Aggregate Monthly Cash Flow (CSV) |
                | Aggregate Yearly Cash Flow (CSV)  |

        Scenario Outline: Exporting PDF <export-option>
            When PDF Export button is clicked
            And <export-option> option is clicked
            And Save button is clicked
            Then A file matching cc suggested template for <export-option> should be exported

            Examples:
                | export-option                     |
                | Well Cash Flow (PDF)              |
                | Aggregate Cash Flow (PDF)         |

    Rule: 1 menu, custom pdf off
        don't show custom pdf editor, there will be only 1 menu
        Background: Open economics page without launchdarkly pdf flag
            # https://app.launchdarkly.com/default/test/features/roll-out-custom-pdf-generation
            # https://app.launchdarkly.com/default/test/features/roll-out-economics-export-menu-items-variation
            Given Launchdarkly Feature Flag "roll-out-custom-pdf-generation" is set to "false"                           
            And Launchdarkly Feature Flag "roll-out-economics-export-menu-items-variation" is set to "old-and-defaults" 
            And Economics page is open

        Scenario Outline: Exporting <export-option>
            When Export button is clicked
            And <export-option> option is clicked
            And Save button is clicked
            Then A file matching cc suggested template for <export-option> should be exported

            Examples:
                | export-option                     |
                | Core Headers                      |
                | By Well                           |
                | Aggregate Monthly                 |
                | Well Oneline Cash Flow (CSV)      |
                | Well Monthly Cash Flow (CSV)      |
                | Well Yearly Cash Flow (CSV)       |
                | Well Carbon Report (CSV)          |
                | Well Cash Flow (PDF)              |
                | Aggregate Monthly Cash Flow (CSV) |
                | Aggregate Yearly Cash Flow (CSV)  |
                | Aggregate Cash Flow (PDF)         |