Feature: PDF Export Editor

    PDF Editor can be opened from scenario page / economics, on the toolbar

    # Scenario: change template name
    #     Given pdf dialog is open
    #     When template name is set to "my template name"
    #     Then template name input should contain "my template name"

    # Scenario: loading existing templates
    #     when the dialog is opened it will only show cashflow-pdf templates,
    #     since we only visualize 1 template type at the same time
    #     Given there are templates with configuration:
    #         | name                  | type              |
    #         | monthly template      | cashflow-pdf      |
    #         | hybrid template       | cashflow-pdf      |
    #         | agg hybrid template   | cashflow-agg-pdf  |
    #     When pdf dialog is open
    #     Then there should be a template named "monthly template"
    #     Then there should be a template named "hybrid template"
    #     And there should not be a template named "agg hybrid template"

    Rule: form validation
        Background: pdf dialog is opened
            Given pdf dialog is open
        Scenario Outline: hybrid options are <enabled/disabled> for <cashflow-type>
            some description

            When cashflow report is set to <cashflow-type>
            Then hybrid options are <enabled/disabled>

            Examples:
                | cashflow-type | enabled/disabled  |
                | monthly	    | disabled          |
                | yearly	    | disabled          |
                | hybrid	    | enabled           |

    Rule: actions
        Background: pdf dialog is opened
            Given pdf dialog is open

        Scenario: closing the dialog
            When cancel button is clicked
            Then PDF Editor is closed

        Scenario: saving a template
            When template name is set to "my template name"
            And save button is clicked
            Then there should be a template named "my template name"

        Scenario: export button closes the dialog
            When export button is clicked
            Then PDF Editor is closed

        Scenario: export by well
            # When report type is changed to cashflow # no need for this step, cashflow is selected by default
            When export button is clicked
            Then PDF Editor is closed
            And A pdf matching default cashflow should be exported

        Scenario: export aggregate
            When report type is changed to agg-cashflow
            And export button is clicked
            Then PDF Editor is closed
            And A pdf matching default agg-cashflow should be exported
