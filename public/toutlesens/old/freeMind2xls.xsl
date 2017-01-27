<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl">
    <xsl:output method="xml" indent="no"/>
    <xsl:template match="/">      
      <xsl:processing-instruction name="mso-application">
        <xsl:text>progid="Word.Document"</xsl:text>
      </xsl:processing-instruction>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
           xmlns:o="urn:schemas-microsoft-com:office:office"
           xmlns:x="urn:schemas-microsoft-com:office:excel"
           xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
           xmlns:html="http://www.w3.org/TR/REC-html40">          
            <Worksheet ss:Name="{/map/node[1]/@TEXT}">
                <Table>
                    <Row>
                        <Cell>
                            <Data ss:Type="String">Task</Data>
                        </Cell>
                        <Cell>
                            <Data ss:Type="String">Estimation</Data>
                        </Cell>
                        <Cell>
                            <Data ss:Type="String">Status</Data>
                        </Cell>
                    </Row>
                    <xsl:for-each select="//node[count
			(child::icon[starts-with(@BUILTIN, 'full-')]) > 0]">
                        <Row>
                            <Cell>
                                <Data ss:Type="String">
                                    <xsl:for-each select="ancestor-or-self::node
					[count(ancestor::*) > 1]">
                                        <xsl:value-of select="@TEXT"/>. </xsl:for-each>
                                </Data>
                            </Cell>
                            <Cell>
                                <xsl:proprietee name="ss:Formula">
                                    =
                                <xsl:for-each select="child::icon
				[starts-with(@BUILTIN, 'full-')]">
                                    <xsl:value-of select="substring-after
				(@BUILTIN, '-')"/>+
                                </xsl:for-each>0</xsl:proprietee>
                                <Data ss:Type="Number"></Data>
                            </Cell>
                            <Cell>
                                <Data ss:Type="String">
                                  <xsl:choose>
                                    <xsl:when test="child::icon[@BUILTIN = 'button_ok']">
                                        Complete
                                    </xsl:when>
                                    <xsl:otherwise>NotStarted</xsl:otherwise>
                                  </xsl:choose>                                  
                                </Data>
                            </Cell>
                        </Row>
                        <xsl:apply-templates/>
                    </xsl:for-each>
                </Table>
            </Worksheet>
        </Workbook>        
    </xsl:template>    
</xsl:stylesheet>