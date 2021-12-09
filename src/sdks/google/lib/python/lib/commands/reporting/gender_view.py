from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

class ExecuteCommand(BaseCommand):
    __query = """
        SELECT
            %s
        FROM gender_view
        WHERE
            :key :operator ':value' AND
            segments.date BETWEEN ':start_date' AND ':end_date'
    """

    # Generate the fields for request in query
    # attributes = {ad: [strings], metrics: [strings]}
    def __generate_query_fields(self, attributes):
        # Attributes to get
        ad_group_attributes = attributes["adGroup"]
        campaign_attributes = attributes["campaign"]
        customer_attributes = attributes["customer"]
        criterion_attributes = attributes["criterion"]

        # Metrics and segments to get
        metrics = attributes["metrics"]
        segments = attributes["segments"]

        fields = ''

        # Loop for ad_group's attributes
        if(ad_group_attributes and len(ad_group_attributes)):
            ad_group_constant = 'ad_group.'
            for field in ad_group_attributes:
                fields += (ad_group_constant + field + ',')
        
        # Loop for campaign's attributes
        if(campaign_attributes and len(campaign_attributes)):
            campaign_constant = 'campaign.'
            for field in campaign_attributes:
                fields += (campaign_constant + field + ',')
        
        # Loop for customer's attributes
        if(customer_attributes and len(customer_attributes)):
            customer_constant = 'customer.'
            for field in customer_attributes:
                fields += (customer_constant + field + ',')
        
         # Loop for criterion's attributes
        if(criterion_attributes and len(criterion_attributes)):
            criterion_constant = 'ad_group_criterion.'
            for field in criterion_attributes:
                fields += (criterion_constant + field + ',')

        # Loop for metric's attributes
        metrics_constant = 'metrics.'
        for field in metrics:
            fields += (metrics_constant + field + ",")
        
        # Loop for segment's attributes
        segments_constant = 'segments.'
        for field in segments:
            fields += (segments_constant + field)
            if(segments[-1] != field):
                fields += ','

        return fields


    # map result row
    def __map_result_row(self, row):
        # reportView
        reportView = self.serialize(row.gender_view)

        # Metrics
        metrics = self.serialize(row.metrics)

        # Segments
        segments = self.serialize(row.segments)

        # campaign of report
        campaign = self.serialize(row.campaign)

        # ad_group of report
        ad_group = self.serialize(row.ad_group)

        # Customer
        customer = self.serialize(row.customer)

        # ad_group_criterion
        ad_group_criterion = self.serialize(row.ad_group_criterion)

        reportView["metrics"] = metrics
        reportView["segments"] = segments
        reportView["campaign"] = campaign
        reportView["adGroup"] = ad_group
        reportView["customer"] = customer
        reportView["criterion"] = ad_group_criterion

        return reportView

    # convert response to serialized campaigns list
    def __response_to_campaigns(self, responses):
        return self.loop_result(
            responses=responses,
            callback=lambda row: self.__map_result_row(row)
        )

    # start execution
    @override_method
    def start_execution(self):
        # {ad, metrics}
        attributes = self.get_argument("attributes")

        start_date = self.get_argument("startDate")
        end_date = self.get_argument("endDate")

        condition = self.get_argument("condition")
        
        condition_key = condition["key"]
        condition_value = None
        condition_operator = "="

        if("value" in condition):
            condition_value = condition["value"]

        if("operator" in condition):
            condition_operator = condition["operator"]

        # Get customer id from sdk
        if(condition_key == "customer.id"):
            condition_value = self.get_client_customer_id()

        # Generate query attributes
        query_attributes = self.__generate_query_fields(attributes=attributes)
        self.__query = (self.__query % query_attributes)

        responses = self.run_query(self.__query, {
            "key": condition_key,
            "value": condition_value,
            "operator" : condition_operator,
            "start_date": start_date,
            "end_date": end_date,
        })

        ad_report = self.__response_to_campaigns(responses)

        return ad_report
