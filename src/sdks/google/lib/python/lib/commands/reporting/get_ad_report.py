from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand


class ExecuteCommand(BaseCommand):
    # you can see AdgroupAds fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/AdGroupAd

    __query = """
        SELECT
            %s
        FROM
            ad_group_ad
        WHERE 
            ad_group_ad.ad_group=':ad_group_resource'
         ORDER BY
            ad_group_ad.ad.id
    """

    # Generate the fields for request in query
    # attributes = {ad: [strings], metrics: [strings]}
    def __generate_query_fields(self, attributes):
        ad_attributes = attributes["ad"]
        metrics = attributes["metrics"]

        fields = ''

        if("id" not in ad_attributes):
            ad_attributes.append("id")

        # Loop for ad's attributes
        ad_constant = 'ad_group_ad.ad.'
        for field in ad_attributes:
            fields += (ad_constant + field + ',')

        # Loop for metric's attributes
        metrics_constant = 'metrics.'
        for field in metrics:
            fields += (metrics_constant + field)
            if(metrics[-1] != field):
                fields += ','
        return fields

    # map result row
    def __map_result_row(self, row):
        metrics = self.serialize(row.metrics)
        ad = self.serialize(row.ad_group_ad)

        # TEST DATA
        # metrics["clicks"] = 1500
        # metrics["impressions"] = 8500
        # metrics["costMicros"] = 80000
        # metrics["ctr"] = 3.5
        # metrics["average_cpc"] = 2.6
        # metrics["average_cpm"] = 3.1

        ad["metrics"] = metrics

        return ad

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

        adgroup_resource = self.get_resource_by_id(
            "adGroups", self.get_argument("adGroupId"))

        # Generate query attributes
        query_attributes = self.__generate_query_fields(attributes=attributes)
        self.__query = (self.__query % query_attributes)

        responses = self.run_query(self.__query, {
            "ad_group_resource": adgroup_resource
        })

        ad_report = self.__response_to_campaigns(responses)

        return ad_report
