from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_ad_group


class ExecuteCommand(BaseCommand):
    # you can see AdGroup fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/AdGroup

    __query = """
        SELECT
            %s
        FROM
            ad_group
        WHERE
            ad_group.id = :ad_group_id
    """

    # map result row
    def __map_result_row(self, row):
        ad_group = self.serialize(row.ad_group)

        metrics = self.serialize(row.metrics)
        if (len(metrics.keys()) != 0):
            ad_group["metrics"] = metrics

        return ad_group

    # convert response to serialized ad-groups list
    def __response_to_ad_groups(self, responses):
        return self.loop_result(
            responses=responses,
            callback=lambda row: self.__map_result_row(row)
        )

    # Generate the fields for request in query
    def __generate_query_fields(self, attributes):
        ad_group_attributes = attributes["adGroup"]

        fields = ''

        if("id" not in ad_group_attributes):
            ad_group_attributes.append("id")

        # Loop for adgroup's attributes
        ad_group_constant = 'ad_group.'
        for field in ad_group_attributes:
            fields += (ad_group_constant + field)
            if(ad_group_attributes[-1] != field):
                fields += ','

        # Loop for metric's attributes
        if(("metrics" in attributes) and (len(attributes["metrics"]) != 0)):
            metrics = attributes["metrics"]
            fields += ","
            metrics_constant = 'metrics.'
            for field in metrics:
                fields += (metrics_constant + field)
                if(metrics[-1] != field):
                    fields += ','

        return fields

    # start execution
    @override_method
    def start_execution(self):
        # Generate query attributes
        attributes = self.get_argument("attributes")
        query_attributes = self.__generate_query_fields(attributes=attributes)
        self.__query = (self.__query % query_attributes)

        responses = self.run_query(self.__query, {
            "ad_group_id": self.get_argument("adGroupId")
        })

        ad_groups = self.__response_to_ad_groups(responses)

        if(len(ad_groups) != 0):
            return ad_groups[0]

        return None
