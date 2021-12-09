from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# QUERY LOCATION VIEW
#  SELECT
#             location_view.resource_name,
#             segments.date,
#             campaign_criterion.location.geo_target_constant,
#             %s
#         FROM location_view
#         WHERE
#             customer.id='9391319418' AND
#             segments.date BETWEEN ':start_date' AND ':end_date'

# Parental Status view
# SELECT
#     segments.date,
#     ad_group.campaign,
#     ad_group.name,
#     campaign.id,
#     campaign.name,
#     ad_group_criterion.criterion_id,
#     %s
# FROM parental_status_view
# WHERE
#     customer.id='9391319418' AND
#     segments.date BETWEEN ':start_date' AND ':end_date'


#  SELECT
#             segments.date,
#             ad_group_criterion.income_range.type,
#             ad_group_criterion,
#             ad_group_criterion.gender.type,
#             ad_group_criterion.age_range.type,
#             %s
#         FROM
#             age_range_view
#         WHERE 
#             customer.id='9391319418' AND
#             segments.date BETWEEN ':start_date' AND ':end_date'

class ExecuteCommand(BaseCommand):
    # you can see AdgroupAds fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/AdGroupAd
    # ad_group.name,
    # ad_group.type,
    # campaign.name,

    __query = """
        SELECT
            segments.date,
            ad_group.campaign,
            ad_group.name,
            campaign.id,
            campaign.name,
            ad_group_criterion.criterion_id,
            %s
        FROM webpage_view
        WHERE
            customer.id='9391319418' AND
            segments.date BETWEEN ':start_date' AND ':end_date'
    """
    # ad_group_ad.ad.type IN ('RESPONSIVE_DISPLAY_AD', 'RESPONSIVE_SEARCH_AD')

    # Generate the fields for request in query
    # attributes = {ad: [strings], metrics: [strings]}
    def __generate_query_fields(self, attributes):
        ad_attributes = attributes["ad"]
        metrics = attributes["metrics"]

        fields = ''

        if("id" not in ad_attributes):
            ad_attributes.append("id")

        # # Loop for ad's attributes
        # ad_constant = 'ad_group_ad.ad.'
        # for field in ad_attributes:
        #     fields += (ad_constant + field + ',')

        # Loop for metric's attributes
        metrics_constant = 'metrics.'
        for field in metrics:
            fields += (metrics_constant + field)
            if(metrics[-1] != field):
                fields += ','

        return fields

    # map result row
    def __map_result_row(self, row):
        # Metrics of ad
        metrics = self.serialize(row.metrics)

        # Segments of ad
        segments = self.serialize(row.segments)

        # ad
        ad = self.serialize(row.ad_group_ad)

        # campaign of ad
        campaign = self.serialize(row.campaign)

        # ad_group of ad
        ad_group = self.serialize(row.ad_group)
        ad_group_criterion = self.serialize(row.ad_group_criterion)
        geographic_view = self.serialize(row.webpage_view)

        ad["metrics"] = metrics
        ad["segments"] = segments
        ad["campaign"] = campaign
        ad["adGroup"] = ad_group
        ad["adGroupCriterion"] = ad_group_criterion
        ad["landing"] = geographic_view

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

        start_date = self.get_argument("startDate")
        end_date = self.get_argument("endDate")

        adgroup_resource = self.get_resource_by_id(
            "adGroups", self.get_argument("adGroupId"))

        # Generate query attributes
        query_attributes = self.__generate_query_fields(attributes=attributes)
        self.__query = (self.__query % query_attributes)

        responses = self.run_query(self.__query, {
            "ad_group_resource": adgroup_resource,
            "start_date": start_date,
            "end_date": end_date,
        })

        ad_report = self.__response_to_campaigns(responses)

        return ad_report
